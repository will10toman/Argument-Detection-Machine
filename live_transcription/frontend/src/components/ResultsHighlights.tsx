import { Segment } from '@/store/analysisStore';

interface ResultsHighlightsProps {
  text: string;
  segments: Segment[];
}

const ResultsHighlights = ({ text, segments }: ResultsHighlightsProps) => {
  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Claim':
        return 'bg-claim/20 border-claim/40';
      case 'Evidence':
        return 'bg-evidence/20 border-evidence/40';
      default:
        return 'bg-non-informative/20 border-non-informative/40';
    }
  };

  const sortedSegments = [...segments].sort((a, b) => a.startIndex - b.startIndex);

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-claim/20 border border-claim/40" />
          <span className="text-sm">Claim</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-evidence/20 border border-evidence/40" />
          <span className="text-sm">Evidence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-non-informative/20 border border-non-informative/40" />
          <span className="text-sm">Non-informative</span>
        </div>
      </div>

      {/* Highlighted Text */}
      <div className="p-6 bg-card border rounded-lg space-y-3 leading-relaxed">
        {sortedSegments.map((segment, index) => (
          <span
            key={segment.id}
            className={`inline-block px-2 py-1 rounded border ${getLabelColor(
              segment.label
            )} transition-all hover:shadow-sm`}
            title={`${segment.label} (${(segment.confidence * 100).toFixed(1)}% confidence)`}
          >
            {segment.text}
            {index < sortedSegments.length - 1 && ' '}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-claim/10 border border-claim/20 rounded-lg">
          <div className="text-2xl font-bold text-claim">
            {segments.filter((s) => s.label === 'Claim').length}
          </div>
          <div className="text-sm text-muted-foreground">Claims</div>
        </div>
        <div className="p-4 bg-evidence/10 border border-evidence/20 rounded-lg">
          <div className="text-2xl font-bold text-evidence">
            {segments.filter((s) => s.label === 'Evidence').length}
          </div>
          <div className="text-sm text-muted-foreground">Evidence</div>
        </div>
        <div className="p-4 bg-non-informative/10 border border-non-informative/20 rounded-lg">
          <div className="text-2xl font-bold text-non-informative">
            {segments.filter((s) => s.label === 'Non-informative').length}
          </div>
          <div className="text-sm text-muted-foreground">Non-informative</div>
        </div>
      </div>
    </div>
  );
};

export default ResultsHighlights;
