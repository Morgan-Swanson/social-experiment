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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchStudyStatus();
    return () => {
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
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

        // If study is running, start polling
        if (current?.status === 'running') {
          startPolling();
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

  const startPolling = () => {
    setIsStreaming(true);
    setLoading(false);
    
    // Poll for progress every 500ms
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/studies/${params.id}/progress`);
        if (response.ok) {
          const data = await response.json();
          
          setCurrentRow(data.currentRow);
          setTotalRows(data.totalRows);
          setProgress(data.progressPercent);
          
          // Update results in real-time
          if (data.results && data.results.length > 0) {
            setResults(data.results);
            
            // Set columns from first result if not already set
            if (columns.length === 0 && data.results[0]) {
              const rowColumns = Object.keys(data.results[0].rowData || {});
              const classifierColumns = Object.keys(data.results[0].classifications || {});
              setColumns([...rowColumns, ...classifierColumns]);
            }
          }
          
          // If study completed, stop polling
          if (data.status === 'completed') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            setIsStreaming(false);
          } else if (data.status === 'failed') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            setIsStreaming(false);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to poll progress:', error);
      }
    };
    
    // Poll immediately and then every 500ms
    pollProgress();
    pollingIntervalRef.current = setInterval(pollProgress, 500);
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
                  currentRow === 0 && totalRows === 0 ? (
                    <span className="flex items-center gap-2 text-yellow-600">
                      <Activity className="h-4 w-4 animate-pulse" />
                      Initializing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-primary">
                      <Activity className="h-4 w-4 animate-pulse" />
                      Processing row {currentRow} of {totalRows} ({Math.round(progress)}%)
                    </span>
                  )
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