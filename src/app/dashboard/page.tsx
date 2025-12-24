'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Database, FileText, Settings, Beaker } from 'lucide-react';

export default function DashboardHome() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Classification platform for social science research
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:border-red-500/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/data')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-red-500" />
              <div>
                <CardTitle>Data</CardTitle>
                <CardDescription>Upload and manage CSV datasets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload CSV files containing your unclassified data with unique IDs and text samples.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/classifiers')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <CardTitle>Classifiers</CardTitle>
                <CardDescription>Create classification prompts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define prompts that give the AI model instructions for classifying your data.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-red-500/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/constraints')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-red-500" />
              <div>
                <CardTitle>Constraints</CardTitle>
                <CardDescription>Define global rules</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create overarching rules that apply across all classifiers in your studies.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/study')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Beaker className="h-8 w-8 text-blue-500" />
              <div>
                <CardTitle>Study</CardTitle>
                <CardDescription>Run classification experiments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Combine data and classifiers to run batch classifications and export results.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-500/10 text-red-500 w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <p className="text-sm">Configure your OpenAI API key in Account settings</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-500/10 text-blue-500 w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <p className="text-sm">Upload your CSV dataset in the Data section</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-500/10 text-red-500 w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <p className="text-sm">Create classification prompts in the Classifiers section</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-500/10 text-blue-500 w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
            <p className="text-sm">Run your study and download the results</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}