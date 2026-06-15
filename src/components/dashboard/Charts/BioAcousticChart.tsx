import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { getLayerForY } from '@/utils/nodeGeometry';

interface BioAcousticChartProps {
  silo: {
    id: string;
    currentLevel: number;
    capacity: number;
    layerCount?: number;
    nodes: Array<{ id: string; active?: boolean; position: { x: number; y: number; z: number }; metrics: { acousticLevel: number } }>;
  };
}

function isLayerMeasuring(layerIndex: number, fillRatio: number, layerCount: number): boolean {
  if (fillRatio <= 0) return false;
  if (layerIndex === 0) return true;
  return fillRatio >= layerIndex / layerCount;
}

export default function BioAcousticChart({ silo }: BioAcousticChartProps) {
  const fillRatio = silo.capacity > 0 ? silo.currentLevel / silo.capacity : 0;
  const layerCount = silo.layerCount ?? 3;

  const activeNodes = useMemo(
    () => silo.nodes.filter((n) => {
      if (n.active === false) return false;
      const layer = getLayerForY(n.position.y, layerCount);
      return isLayerMeasuring(layer, fillRatio, layerCount);
    }),
    [silo.nodes, fillRatio, layerCount],
  );

  const data = useMemo(() => {
    return activeNodes.map((node) => ({
      name: node.id.split('-').pop(),
      dB: parseFloat(node.metrics.acousticLevel.toFixed(1)),
      color:
        node.metrics.acousticLevel > 20 ? '#ef4444' :
        node.metrics.acousticLevel > 12 ? '#eab308' :
        '#22c55e',
    }));
  }, [silo.id, activeNodes]);

  if (activeNodes.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Sin nodos activos</p>
      </div>
    );
  }

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