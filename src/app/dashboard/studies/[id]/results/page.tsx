'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Activity } from 'lucide-react';

export default function StudyResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [study, setStudy] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchStudyStatus();
    return () => {
      // Cleanup SSE connection on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [params.id]);

  const fetchStudyStatus = async () => {
    try {
      // Fetch study metadata
      const studyResponse = await fetch('/api/studies');
      if (studyResponse.ok) {
        const studies = await studyResponse.json();
        const current = studies.find((s: any) => s.id === params.id);
        setStudy(current);

        // If study is running, start streaming
        if (current?.status === 'running') {
          startStreaming();
        } else if (current?.status === 'completed') {
          // Load completed results
          fetchResults();
        } else {
          // Study in other state (pending, failed), still try to load any existing results
          fetchResults();
        }
      }
    } catch (error) {
      console.error('Failed to fetch study status:', error);
      setLoading(false);
    }
  };

  const startStreaming = () => {
    setIsStreaming(true);
    setLoading(false);
    
    // Connect to SSE endpoint
    const eventSource = new EventSource(`/api/studies/${params.id}/stream`);
    eventSourceRef.current = eventSource;

    // Add timeout to check if study completed while we were connecting
    const timeoutId = setTimeout(() => {
      // If we haven't received any row_complete events after 5 seconds, check status
      if (results.length === 0) {
        console.log('No streaming data received, checking if study completed');
        fetchStudyStatus();
      }
    }, 5000);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'connected') {
        console.log('Connected to study stream');
      } else if (data.type === 'row_complete') {
        clearTimeout(timeoutId); // Clear timeout since we got data
        
        // Add new row to results
        setCurrentRow(data.rowIndex + 1);
        setTotalRows(data.totalRows);
        setProgress(data.progress);
        
        setResults(prev => [...prev, data.result]);
        
        // Set columns from first result
        if (data.rowIndex === 0 && data.result.rowData) {
          const rowColumns = Object.keys(data.result.rowData);
          const classifierColumns = Object.keys(data.result.classifications || {});
          setColumns([...rowColumns, ...classifierColumns]);
        }
      } else if (data.type === 'complete') {
        clearTimeout(timeoutId);
        // Study completed, close stream and load final results
        eventSource.close();
        setIsStreaming(false);
        fetchResults();
      }
    };

    eventSource.onerror = () => {
      clearTimeout(timeoutId);
      eventSource.close();
      setIsStreaming(false);
      fetchResults(); // Fallback to regular fetch
    };
  };

  const fetchResults = async () => {
    try {
      // Fetch study metadata
      const studyResponse = await fetch('/api/studies');
      if (studyResponse.ok) {
        const studies = await studyResponse.json();
        const current = studies.find((s: any) => s.id === params.id);
        setStudy(current);
      }

      // Fetch results in JSON format
      const resultsResponse = await fetch(`/api/studies/${params.id}/results`);
      if (resultsResponse.ok) {
        const data = await resultsResponse.json();
        setResults(data);

        // Extract columns from first result
        if (data.length > 0) {
          const rowColumns = Object.keys(data[0].rowData || {});
          const classifierColumns = Object.keys(data[0].classifications || {});
          setColumns([...rowColumns, ...classifierColumns]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/studies/${params.id}/export`, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading results...</p>
      </div>
    );
  }

  const renderResults = () => {
    if (results.length === 0 && !isStreaming) {
      return <p className="text-muted-foreground">No results yet.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col, i) => (
                <th key={i} className="p-2 text-left font-medium whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result, i) => (
              <tr key={i} className="border-b hover:bg-muted/50">
                {Object.keys(result.rowData || {}).map((key, j) => (
                  <td key={j} className="p-2 whitespace-nowrap">
                    {result.rowData[key]}
                  </td>
                ))}
                {Object.keys(result.classifications || {}).map((classifierId, j) => {
                  const classification = result.classifications[classifierId];
                  const displayValue = typeof classification === 'object' 
                    ? (classification.reasoning || classification.score || '') 
                    : classification;
                  return (
                    <td key={`class-${j}`} className="p-2 whitespace-nowrap">
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/study')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Studies
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{study?.name || 'Study Results'}</h1>
            {study?.description && (
              <p className="text-muted-foreground mt-1">{study.description}</p>
            )}
          </div>
        </div>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Classification Results</CardTitle>
              <CardDescription>
                {isStreaming ? (
                  <span className="flex items-center gap-2 text-primary">
                    <Activity className="h-4 w-4 animate-pulse" />
                    Processing row {currentRow} of {totalRows} ({Math.round(progress)}%)
                  </span>
                ) : (
                  `${results.length} rows processed`
                )}
              </CardDescription>
            </div>
            {isStreaming && (
              <div className="w-48 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderResults()}
        </CardContent>
      </Card>
    </div>
  );
}