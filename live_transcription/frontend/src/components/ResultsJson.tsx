import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnalysisRun } from '@/store/analysisStore';
import { useToast } from '@/hooks/use-toast';

interface ResultsJsonProps {
  analysis: AnalysisRun;
}

const ResultsJson = ({ analysis }: ResultsJsonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const jsonString = JSON.stringify(analysis, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied to clipboard',
      description: 'JSON data has been copied.',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Raw API Response</p>
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 overflow-auto max-h-[600px]">
        <pre className="text-xs font-mono">{jsonString}</pre>
      </div>
    </div>
  );
};

export default ResultsJson;
