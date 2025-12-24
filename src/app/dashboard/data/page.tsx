'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DataPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/datasets');
      if (response.ok) {
        const data = await response.json();
        setDatasets(data);
      }
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/datasets', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const dataset = await response.json();
        setDatasets([...datasets, dataset]);
        fetchDatasets(); // Refresh the list
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
      setDatasets(datasets.filter(d => d.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      const response = await fetch(`/api/datasets/${id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">Data Management</h1>
        <p className="text-muted-foreground">
          Upload and manage your CSV datasets for classification
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Dataset</CardTitle>
            <CardDescription>
              Upload a CSV file with your unclassified data. Include unique IDs and text samples.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="file">CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
              {uploading && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Datasets</CardTitle>
            <CardDescription>
              Manage your uploaded datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {datasets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No datasets uploaded yet
              </p>
            ) : (
              <div className="space-y-4">
                {datasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/dashboard/datasets/${dataset.id}/view`}
                  >
                    <div>
                      <h3 className="font-medium">{dataset.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {dataset.rowCount} rows • {dataset.columns.length} columns
                      </p>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDownload(dataset.id, dataset.filename)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(dataset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}