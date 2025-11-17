import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Segment } from '@/store/analysisStore';
import { convertSegmentsToCSV } from '@/lib/api';

interface ResultsSegmentsProps {
  segments: Segment[];
}

const ResultsSegments = ({ segments }: ResultsSegmentsProps) => {
  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Claim':
        return 'claim';
      case 'Evidence':
        return 'evidence';
      default:
        return 'non-informative';
    }
  };

  const handleExportCSV = () => {
    const csv = convertSegmentsToCSV(segments);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adm-analysis-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(segments, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adm-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {segments.length} segments detected
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportJSON}>
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Text</TableHead>
              <TableHead className="w-[25%]">Label</TableHead>
              <TableHead className="w-[25%]">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.map((segment) => (
              <TableRow key={segment.id}>
                <TableCell className="font-mono text-sm">{segment.text}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`bg-${getLabelColor(segment.label)}/10 text-${getLabelColor(
                      segment.label
                    )} border-${getLabelColor(segment.label)}/20`}
                  >
                    {segment.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${getLabelColor(segment.label)} transition-all`}
                        style={{ width: `${segment.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-12 text-right">
                      {(segment.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResultsSegments;
