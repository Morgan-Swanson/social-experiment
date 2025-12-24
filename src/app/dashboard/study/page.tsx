'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Play, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

export default function StudyPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [classifiers, setClassifiers] = useState<any[]>([]);
  const [constraints, setConstraints] = useState<any[]>([]);
  const [studies, setStudies] = useState<any[]>([]);
  
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedClassifiers, setSelectedClassifiers] = useState<string[]>([]);
  const [selectedConstraint, setSelectedConstraint] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [sampleSize, setSampleSize] = useState(100);
  const [maxRows, setMaxRows] = useState(100);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const [datasetsRes, classifiersRes, constraintsRes, studiesRes] = await Promise.all([
      fetch('/api/datasets'),
      fetch('/api/classifiers'),
      fetch('/api/constraints'),
      fetch('/api/studies'),
    ]);

    if (datasetsRes.ok) setDatasets(await datasetsRes.json());
    if (classifiersRes.ok) setClassifiers(await classifiersRes.json());
    if (constraintsRes.ok) setConstraints(await constraintsRes.json());
    if (studiesRes.ok) setStudies(await studiesRes.json());
  };

  useEffect(() => {
    const dataset = datasets.find(d => d.id === selectedDataset);
    if (dataset) {
      setMaxRows(dataset.rowCount);
      setSampleSize(Math.min(100, dataset.rowCount));
    }
  }, [selectedDataset, datasets]);

  const handleClassifierToggle = (id: string) => {
    setSelectedClassifiers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleRunStudy = async () => {
    const response = await fetch('/api/studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId: selectedDataset,
        classifierIds: selectedClassifiers,
        constraintId: selectedConstraint || null,
        modelProvider: 'openai',
        modelName: selectedModel,
        sampleSize,
      }),
    });

    if (response.ok) {
      fetchData();
    }
  };

  const handleDownloadResults = async (studyId: string) => {
    const response = await fetch(`/api/studies/${studyId}/export`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-results-${studyId}.csv`;
      a.click();
    }
  };

  const handleRerunStudy = async (studyId: string) => {
    try {
      const response = await fetch(`/api/studies/${studyId}/process`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to rerun study:', error);
    }
  };

  const toggleErrorExpanded = (studyId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studyId)) {
        newSet.delete(studyId);
      } else {
        newSet.add(studyId);
      }
      return newSet;
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">Studies</h1>
        <p className="text-muted-foreground">
          Create and run classification studies
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Study</CardTitle>
            <CardDescription>
              Configure and run a classification study
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>Select Dataset</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
              >
                <option value="">Choose a dataset...</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Select Classifiers</Label>
              {classifiers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classifiers available</p>
              ) : (
                <div className="space-y-2">
                  {classifiers.map((classifier) => (
                    <div key={classifier.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={classifier.id}
                        checked={selectedClassifiers.includes(classifier.id)}
                        onCheckedChange={() => handleClassifierToggle(classifier.id)}
                      />
                      <label htmlFor={classifier.id} className="text-sm cursor-pointer">
                        {classifier.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Constraint (Optional)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={selectedConstraint}
                onChange={(e) => setSelectedConstraint(e.target.value)}
              >
                <option value="">No constraint</option>
                {constraints.map((constraint) => (
                  <option key={constraint.id} value={constraint.id}>
                    {constraint.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>AI Model</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="o1-preview">O1 Preview</option>
                <option value="o1-mini">O1 Mini</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Sample Size: {sampleSize} rows</Label>
              <Slider
                value={[sampleSize]}
                onValueChange={(v) => setSampleSize(v[0])}
                max={maxRows}
                min={1}
                step={1}
                disabled={!selectedDataset}
              />
              <p className="text-xs text-muted-foreground">
                Test your classifier on a subset of your data
              </p>
            </div>

            <Button
              onClick={handleRunStudy}
              disabled={!selectedDataset || selectedClassifiers.length === 0}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Study
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Results</CardTitle>
            <CardDescription>
              View and download completed studies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No studies run yet
              </p>
            ) : (
              <div className="space-y-4">
                {studies.map((study) => (
                  <div 
                    key={study.id} 
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (study.status === 'completed') {
                        window.location.href = `/dashboard/studies/${study.id}/results`;
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {study.name || 'Untitled Study'}
                            {(study as any).runNumber > 1 && (
                              <span className="text-sm text-muted-foreground ml-2">(run #{(study as any).runNumber})</span>
                            )}
                          </h3>
                          {study.status === 'running' && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Status: <span className="capitalize">{study.status}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Model: {study.modelName}
                        </p>
                        {study.status === 'failed' && study.errorMessage && (
                          <div className="mt-2">
                            <button
                              onClick={() => toggleErrorExpanded(study.id)}
                              className="flex items-center gap-2 text-sm font-medium text-destructive hover:underline"
                            >
                              {expandedErrors.has(study.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              Error Details
                            </button>
                            {expandedErrors.has(study.id) && (
                              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                                <p className="text-destructive/90 whitespace-pre-wrap">{study.errorMessage}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {study.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadResults(study.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        {(study.status === 'completed' || study.status === 'failed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRerunStudy(study.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Re-run
                          </Button>
                        )}
                      </div>
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