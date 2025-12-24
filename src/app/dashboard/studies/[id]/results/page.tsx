'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download } from 'lucide-react';

export default function StudyResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [study, setStudy] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [params.id]);

  const fetchResults = async () => {
    try {
      // Fetch study metadata
      const studyResponse = await fetch('/api/studies');
      if (studyResponse.ok) {
        const studies = await studyResponse.json();
        const current = studies.find((s: any) => s.id === params.id);
        setStudy(current);
      }

      // Fetch and parse results CSV
      const response = await fetch(`/api/studies/${params.id}/export`);
      if (response.ok) {
        const text = await response.text();
        
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          setColumns(headers);
          
          const rows = lines.slice(1).map(line => {
            // Handle CSV with potential commas in quoted fields
            const values: string[] = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let char of line) {
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            values.push(currentValue.trim());
            
            const row: any = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return row;
          });
          
          setResults(rows);
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
          <CardTitle>Classification Results</CardTitle>
          <CardDescription>{results.length} rows processed</CardDescription>
        </CardHeader>
        <CardContent>
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
                {results.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    {columns.map((col, j) => (
                      <td key={j} className="p-2 whitespace-nowrap">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}