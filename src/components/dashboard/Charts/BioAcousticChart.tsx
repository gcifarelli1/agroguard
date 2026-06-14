import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import ChartTooltip from './ChartTooltip';

interface BioAcousticChartProps {
  silo: {
    id: string;
    nodes: Array<{ id: string; metrics: { acousticLevel: number } }>;
  };
}

export default function BioAcousticChart({ silo }: BioAcousticChartProps) {
  const data = useMemo(() => {
    return silo.nodes.map((node) => ({
      name: node.id.split('-').pop(),
      dB: parseFloat(node.metrics.acousticLevel.toFixed(1)),
      color:
        node.metrics.acousticLevel > 20 ? '#ef4444' :
        node.metrics.acousticLevel > 12 ? '#eab308' :
        '#22c55e',
    }));
  }, [silo.id, silo.nodes]);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            domain={[0, 30]}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar dataKey="dB" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}