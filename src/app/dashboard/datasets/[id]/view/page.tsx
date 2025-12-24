'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download } from 'lucide-react';

export default function DatasetViewPage() {
  const params = useParams();
  const router = useRouter();
  const [dataset, setDataset] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataset();
  }, [params.id]);

  const fetchDataset = async () => {
    try {
      const response = await fetch(`/api/datasets/${params.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const text = await blob.text();
        
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim());
          setColumns(headers);
          
          const rows = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return row;
          });
          
          setData(rows);
        }
      }
      
      // Fetch dataset metadata
      const metaResponse = await fetch('/api/datasets');
      if (metaResponse.ok) {
        const datasets = await metaResponse.json();
        const current = datasets.find((d: any) => d.id === params.id);
        setDataset(current);
      }
    } catch (error) {
      console.error('Failed to fetch dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    window.open(`/api/datasets/${params.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading dataset...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/data')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Datasets
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{dataset?.name || 'Dataset'}</h1>
            {dataset?.description && (
              <p className="text-muted-foreground mt-1">{dataset.description}</p>
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
          <CardTitle>Dataset Preview</CardTitle>
          <CardDescription>{data.length} rows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columns.map((col, i) => (
                    <th key={i} className="p-2 text-left font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    {columns.map((col, j) => (
                      <td key={j} className="p-2">
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