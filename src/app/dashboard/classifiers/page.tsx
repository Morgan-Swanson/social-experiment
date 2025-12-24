'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ClassifiersPage() {
  const [classifiers, setClassifiers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', prompt: '' });

  useEffect(() => {
    fetchClassifiers();
  }, []);

  const fetchClassifiers = async () => {
    const response = await fetch('/api/classifiers');
    if (response.ok) {
      const data = await response.json();
      setClassifiers(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/classifiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setFormData({ name: '', description: '', prompt: '' });
      setShowForm(false);
      fetchClassifiers();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/classifiers/${id}`, { method: 'DELETE' });
    fetchClassifiers();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Classifiers</h1>
          <p className="text-muted-foreground">
            Create and manage classification prompts
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Classifier
        </Button>
      </div>

      <div className="grid gap-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Classifier</CardTitle>
              <CardDescription>
                Define a classification prompt for your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prompt">Classification Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    rows={6}
                    placeholder="e.g., Classify this text on a scale of 1-5 based on sentiment..."
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Classifier</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Classifiers</CardTitle>
            <CardDescription>
              Manage your classification prompts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classifiers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No classifiers created yet
              </p>
            ) : (
              <div className="space-y-4">
                {classifiers.map((classifier) => (
                  <div
                    key={classifier.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{classifier.name}</h3>
                        {classifier.description && (
                          <p className="text-sm text-muted-foreground">{classifier.description}</p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(classifier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm bg-muted p-3 rounded mt-2">{classifier.prompt}</p>
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