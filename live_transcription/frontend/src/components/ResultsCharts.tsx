import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Segment } from '@/store/analysisStore';

interface ResultsChartsProps {
  segments: Segment[];
}

const ResultsCharts = ({ segments }: ResultsChartsProps) => {
  const labelCounts = {
    Claim: segments.filter((s) => s.label === 'Claim').length,
    Evidence: segments.filter((s) => s.label === 'Evidence').length,
    'Non-informative': segments.filter((s) => s.label === 'Non-informative').length,
  };

  const pieData = [
    { name: 'Claim', value: labelCounts.Claim, color: 'hsl(var(--claim))' },
    { name: 'Evidence', value: labelCounts.Evidence, color: 'hsl(var(--evidence))' },
    {
      name: 'Non-informative',
      value: labelCounts['Non-informative'],
      color: 'hsl(var(--non-informative))',
    },
  ].filter((item) => item.value > 0);

  const barData = [
    { label: 'Claim', count: labelCounts.Claim, fill: 'hsl(var(--claim))' },
    { label: 'Evidence', count: labelCounts.Evidence, fill: 'hsl(var(--evidence))' },
    {
      label: 'Non-informative',
      count: labelCounts['Non-informative'],
      fill: 'hsl(var(--non-informative))',
    },
  ];

  const avgConfidence = {
    Claim:
      segments.filter((s) => s.label === 'Claim').length > 0
        ? segments
            .filter((s) => s.label === 'Claim')
            .reduce((acc, s) => acc + s.confidence, 0) /
          segments.filter((s) => s.label === 'Claim').length
        : 0,
    Evidence:
      segments.filter((s) => s.label === 'Evidence').length > 0
        ? segments
            .filter((s) => s.label === 'Evidence')
            .reduce((acc, s) => acc + s.confidence, 0) /
          segments.filter((s) => s.label === 'Evidence').length
        : 0,
    'Non-informative':
      segments.filter((s) => s.label === 'Non-informative').length > 0
        ? segments
            .filter((s) => s.label === 'Non-informative')
            .reduce((acc, s) => acc + s.confidence, 0) /
          segments.filter((s) => s.label === 'Non-informative').length
        : 0,
  };

  const confidenceData = [
    {
      label: 'Claim',
      confidence: avgConfidence.Claim,
      fill: 'hsl(var(--claim))',
    },
    {
      label: 'Evidence',
      confidence: avgConfidence.Evidence,
      fill: 'hsl(var(--evidence))',
    },
    {
      label: 'Non-informative',
      confidence: avgConfidence['Non-informative'],
      fill: 'hsl(var(--non-informative))',
    },
  ].filter((item) => item.confidence > 0);

  return (
    <div className="space-y-8">
      {/* Distribution Pie Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Label Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Count Bar Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Segment Counts</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Confidence Bar Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Average Confidence by Label</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={confidenceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 1]} />
              <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
              <Bar dataKey="confidence" radius={[8, 8, 0, 0]}>
                {confidenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ResultsCharts;
