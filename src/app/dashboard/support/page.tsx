import { ExternalLink, Github } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SupportPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-muted-foreground mt-2">
          Get help with Social Experiment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Report an Issue
          </CardTitle>
          <CardDescription>
            Found a bug or have a feature request? Let us know on GitHub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We use GitHub Issues to track bugs, feature requests, and questions. Before opening a new issue:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li>Search existing issues to avoid duplicates</li>
            <li>Include steps to reproduce the problem</li>
            <li>Provide relevant screenshots or error messages</li>
            <li>Describe your expected vs actual behavior</li>
          </ul>

          <div className="flex gap-3 pt-4">
            <Button asChild>
              <a 
                href="https://github.com/Morgan-Swanson/social-experiment/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                Open New Issue
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            
            <Button variant="outline" asChild>
              <a 
                href="https://github.com/Morgan-Swanson/social-experiment/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                View Existing Issues
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Issues</CardTitle>
          <CardDescription>
            Quick answers to frequently encountered problems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-1">Study processing is slow</h3>
            <p className="text-sm text-muted-foreground">
              Large datasets may take time to process. The system processes up to 5 rows concurrently. For very large datasets, consider using a smaller sample size first.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-1">Configuration not persisting</h3>
            <p className="text-sm text-muted-foreground">
              Make sure your browser allows localStorage for this site. Check your browser's privacy settings if configurations reset between sessions.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-1">Dataset upload fails</h3>
            <p className="text-sm text-muted-foreground">
              Ensure your CSV file is properly formatted with a header row. Large files may take longer to upload. Check the console for any error messages.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
          <CardDescription>
            Learn more about using Social Experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a 
              href="https://github.com/Morgan-Swanson/social-experiment#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              View Documentation
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}