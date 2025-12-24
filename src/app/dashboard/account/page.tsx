'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession, signOut } from 'next-auth/react';

export default function AccountPage() {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    const response = await fetch('/api/apikeys');
    if (response.ok) {
      const data = await response.json();
      setApiKeys(data);
    }
  };

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/apikeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'openai',
        apiKey: newApiKey,
      }),
    });

    if (response.ok) {
      setNewApiKey('');
      setShowForm(false);
      fetchApiKeys();
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    await fetch(`/api/apikeys/${id}`, { method: 'DELETE' });
    fetchApiKeys();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">Account</h1>
        <p className="text-muted-foreground">
          Manage your account settings and API keys
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <p className="text-sm mt-1">{session?.user?.email}</p>
            </div>
            <div>
              <Label>Name</Label>
              <p className="text-sm mt-1">{session?.user?.name || 'Not set'}</p>
            </div>
            <Button variant="destructive" onClick={() => signOut()}>
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage your OpenAI API keys for running classifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Key className="h-4 w-4 mr-2" />
                Add API Key
              </Button>
            )}

            {showForm && (
              <form onSubmit={handleAddApiKey} className="space-y-4 p-4 border rounded-lg">
                <div className="grid gap-2">
                  <Label htmlFor="apikey">OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      id="apikey"
                      type={showKey ? 'text' : 'password'}
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder="sk-..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Key</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setNewApiKey('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {apiKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No API keys configured
              </p>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="text-sm font-medium">OpenAI</p>
                      <p className="text-xs text-muted-foreground">...{key.keyPreview}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteApiKey(key.id)}
                    >
                      Delete
                    </Button>
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