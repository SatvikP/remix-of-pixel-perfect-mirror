import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUploader } from '@/components/FileUploader';
import { FoundersTable } from '@/components/FoundersTable';
import { useToast } from '@/hooks/use-toast';
import { parseFoundersCSV, analyzeFounderProfiles } from '@/lib/api';
import type { StealthFounder } from '@/lib/types';
import { Users, Sparkles, Upload, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FoundersAnalysisProps {
  onBack?: () => void;
}

export function FoundersAnalysis({ onBack }: FoundersAnalysisProps) {
  const { toast } = useToast();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedFounders, setParsedFounders] = useState<StealthFounder[]>([]);
  const [analyzedFounders, setAnalyzedFounders] = useState<StealthFounder[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');

  const handleFileSelect = useCallback(async (file: File) => {
    setCsvFile(file);
    setAnalyzedFounders([]);
    
    try {
      const csvText = await file.text();
      const founders = parseFoundersCSV(csvText);
      
      if (founders.length === 0) {
        toast({ 
          title: 'Invalid CSV', 
          description: 'No valid founder data found. Ensure your CSV has "Name" and "LinkedIn" columns.', 
          variant: 'destructive' 
        });
        return;
      }
      
      setParsedFounders(founders);
      toast({ 
        title: 'CSV parsed successfully', 
        description: `Found ${founders.length} founders ready for analysis.` 
      });
    } catch (err) {
      toast({ 
        title: 'Error parsing CSV', 
        description: err instanceof Error ? err.message : 'Unknown error', 
        variant: 'destructive' 
      });
    }
  }, [toast]);

  const handleClearFile = useCallback(() => {
    setCsvFile(null);
    setParsedFounders([]);
    setAnalyzedFounders([]);
    setAnalysisProgress(0);
    setAnalysisMessage('');
  }, []);

  const handleAnalyze = async () => {
    if (parsedFounders.length === 0) {
      toast({ title: 'No founders to analyze', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setAnalysisMessage(`Analyzing ${parsedFounders.length} founder profiles with Dust Agent...`);

    try {
      const result = await analyzeFounderProfiles(parsedFounders);
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalyzedFounders(result.founders);
      setAnalysisProgress(100);
      setAnalysisMessage('Analysis complete!');
      
      toast({ 
        title: 'Analysis complete!', 
        description: `Successfully analyzed ${result.stats?.analyzed || 0} of ${result.stats?.total || 0} profiles.${result.stats?.failed ? ` (${result.stats.failed} failed)` : ''}` 
      });

    } catch (err) {
      toast({ 
        title: 'Analysis failed', 
        description: err instanceof Error ? err.message : 'Unknown error', 
        variant: 'destructive' 
      });
      setAnalysisMessage('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCSV = () => {
    if (analyzedFounders.length === 0) return;

    const headers = ['Name', 'Past_Experience', 'Current_Location', 'Industry_Tag', 'LinkedIn_URL', 'Notes'];
    const rows = analyzedFounders.map(f => [
      f.name,
      f.pastExperience || '',
      f.currentLocation || '',
      f.industryTag || '',
      f.linkedinUrl,
      f.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `founders-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'CSV exported', description: 'Your analysis has been downloaded.' });
  };

  const hasResults = analyzedFounders.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Stealth Founders Analysis
          </h2>
          <p className="text-muted-foreground mt-1">
            Upload LinkedIn profiles to analyze founder backgrounds with AI
          </p>
        </div>
        {hasResults && (
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Upload Section */}
      {!hasResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Founders CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV with <code className="bg-muted px-1 rounded">Name</code> and{' '}
              <code className="bg-muted px-1 rounded">LinkedIn</code> columns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUploader
              onFileSelect={handleFileSelect}
              accept=".csv"
              label="Drop your founders CSV here"
              description="CSV with Name and LinkedIn URL columns"
              selectedFile={csvFile}
              onClear={handleClearFile}
            />

            {parsedFounders.length > 0 && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{parsedFounders.length} founders ready</span>
                  </div>
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Profiles'}
                  </Button>
                </div>

                {/* Preview of parsed founders */}
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Preview:</p>
                  <ul className="space-y-1">
                    {parsedFounders.slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span>{f.name}</span>
                        <span className="text-xs opacity-60">({f.linkedinUrl})</span>
                      </li>
                    ))}
                    {parsedFounders.length > 5 && (
                      <li className="text-xs opacity-60">...and {parsedFounders.length - 5} more</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-2">
                <Progress value={analysisProgress} className="h-2" />
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {analysisMessage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {hasResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{analyzedFounders.length} founders analyzed</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearFile}>
              Analyze New List
            </Button>
          </div>
          <FoundersTable founders={analyzedFounders} />
        </div>
      )}
    </div>
  );
}
