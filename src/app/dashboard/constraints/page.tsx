'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', rules: '' });

  useEffect(() => {
    fetchConstraints();
  }, []);

  const fetchConstraints = async () => {
    const response = await fetch('/api/constraints');
    if (response.ok) {
      const data = await response.json();
      setConstraints(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/constraints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setFormData({ name: '', description: '', rules: '' });
      setShowForm(false);
      fetchConstraints();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/constraints/${id}`, { method: 'DELETE' });
    fetchConstraints();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Constraints</h1>
          <p className="text-muted-foreground">
            Define global rules that apply across all classifiers in a study
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Constraint
        </Button>
      </div>

      <div className="grid gap-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Constraint</CardTitle>
              <CardDescription>
                Define overarching rules for model behavior across all classifications
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
                  <Label htmlFor="rules">Constraint Rules</Label>
                  <Textarea
                    id="rules"
                    value={formData.rules}
                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                    rows={6}
                    placeholder="e.g., Always provide scores on a scale of 1-10. Be consistent with terminology..."
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Constraint</Button>
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
            <CardTitle>Your Constraints</CardTitle>
            <CardDescription>
              Manage your global constraint rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {constraints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No constraints created yet
              </p>
            ) : (
              <div className="space-y-4">
                {constraints.map((constraint) => (
                  <div key={constraint.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{constraint.name}</h3>
                        {constraint.description && (
                          <p className="text-sm text-muted-foreground">{constraint.description}</p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(constraint.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm bg-muted p-3 rounded mt-2">{constraint.rules}</p>
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