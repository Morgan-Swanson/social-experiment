'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import '@/app/globals.css';
import { ChevronDown, ChevronUp, Loader2, Trash2 } from 'lucide-react';
import { Play, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'study-config';

interface StudyConfig {
  selectedDataset: string;
  selectedClassifiers: string[];
  selectedConstraints: string[];
  selectedModel: string;
  temperature: number;
  sampleSize: number;
}

export default function StudyPage() {
  const pathname = usePathname();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [classifiers, setClassifiers] = useState<any[]>([]);
  const [constraints, setConstraints] = useState<any[]>([]);
  const [studies, setStudies] = useState<any[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedClassifiers, setSelectedClassifiers] = useState<string[]>([]);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.0);
  const [sampleSize, setSampleSize] = useState(100);
  const [maxRows, setMaxRows] = useState(100);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [newStudyId, setNewStudyId] = useState<string | null>(null);
  const [isConfigFlashing, setIsConfigFlashing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);

  // Load config when navigating to this page
  useEffect(() => {
    const loadConfig = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const config: StudyConfig = JSON.parse(saved);
          setSelectedDataset(config.selectedDataset || '');
          setSelectedClassifiers(config.selectedClassifiers || []);
          setSelectedConstraints(config.selectedConstraints || []);
          setSelectedModel(config.selectedModel || 'gpt-4o');
          setTemperature(config.temperature ?? 0.0);
          setSampleSize(config.sampleSize || 100);
        } catch (error) {
          console.error('Failed to load config:', error);
        }
      }
      setConfigLoaded(true);
    };
    
    loadConfig();
  }, [pathname]); // Reload when pathname changes

  // Save config to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (!configLoaded) return; // Don't save during initial load
    
    const config: StudyConfig = {
      selectedDataset,
      selectedClassifiers,
      selectedConstraints,
      selectedModel,
      temperature,
      sampleSize,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [configLoaded, selectedDataset, selectedClassifiers, selectedConstraints, selectedModel, temperature, sampleSize]);

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
      // Always set sample size to max when dataset changes
      setSampleSize(dataset.rowCount);
    }
  }, [selectedDataset, datasets]);

  const handleClassifierToggle = (id: string) => {
    setSelectedClassifiers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleConstraintToggle = (id: string) => {
    setSelectedConstraints(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleRunStudy = async () => {
    // Flash the configuration card
    setIsConfigFlashing(true);
    setTimeout(() => setIsConfigFlashing(false), 500);

    const response = await fetch('/api/studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId: selectedDataset,
        classifierIds: selectedClassifiers,
        constraintIds: selectedConstraints,
        modelProvider: 'openai',
        modelName: selectedModel,
        temperature,
        sampleSize,
      }),
    });

    if (response.ok) {
      const newStudy = await response.json();
      setNewStudyId(newStudy.id);
      setTimeout(() => setNewStudyId(null), 500);
      fetchData();
      // Configuration is retained - no reset
    }
  };

  const handleDeleteStudy = async () => {
    if (!studyToDelete) return;

    try {
      const response = await fetch(`/api/studies/${studyToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
        setDeleteDialogOpen(false);
        setStudyToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete study:', error);
    }
  };

  const openDeleteDialog = (studyId: string) => {
    setStudyToDelete(studyId);
    setDeleteDialogOpen(true);
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
        <Card className={isConfigFlashing ? 'animate-flash' : ''}>
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
                <div className="space-y-3">
                  {classifiers.map((classifier) => (
                    <div key={classifier.id} className="flex items-center gap-3">
                      <Switch
                        id={classifier.id}
                        checked={selectedClassifiers.includes(classifier.id)}
                        onCheckedChange={() => handleClassifierToggle(classifier.id)}
                      />
                      <label htmlFor={classifier.id} className="text-sm cursor-pointer flex-1">
                        {classifier.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Select Constraints (optional)</Label>
              {constraints.length === 0 ? (
                <p className="text-sm text-muted-foreground">No constraints available</p>
              ) : (
                <div className="space-y-3">
                  {constraints.map((constraint) => (
                    <div key={constraint.id} className="flex items-center gap-3">
                      <Switch
                        id={constraint.id}
                        checked={selectedConstraints.includes(constraint.id)}
                        onCheckedChange={() => handleConstraintToggle(constraint.id)}
                      />
                      <label htmlFor={constraint.id} className="text-sm cursor-pointer flex-1">
                        {constraint.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
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
              <Label>Model Temperature: {temperature.toFixed(1)}</Label>
              <Slider
                value={[temperature]}
                onValueChange={(v) => setTemperature(v[0])}
                max={2.0}
                min={0.0}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                0.0 = deterministic, higher values = more creative/random
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Sample Size: {sampleSize} rows (max: {maxRows})</Label>
              <input
                type="range"
                value={sampleSize}
                onChange={(e) => setSampleSize(Math.min(Number(e.target.value), maxRows))}
                min={1}
                max={maxRows}
                step={1}
                disabled={!selectedDataset}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
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
                      if (study.status === 'completed' || study.status === 'running' || study.status === 'pending') {
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(study.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Study</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this study? This action cannot be undone.
              All results and data associated with this study will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStudy}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}