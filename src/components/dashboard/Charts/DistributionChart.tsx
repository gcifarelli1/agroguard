import { Silo } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { getLayerForY } from '@/utils/nodeGeometry';

interface DistributionChartProps {
  silo: Silo;
}

function isLayerMeasuring(layerIndex: number, fillRatio: number, layerCount: number): boolean {
  if (fillRatio <= 0) return false;
  if (layerIndex === 0) return true;
  return fillRatio >= layerIndex / layerCount;
}

export default function DistributionChart({ silo }: DistributionChartProps) {
  const fillRatio = silo.capacity > 0 ? silo.currentLevel / silo.capacity : 0;
  const layerCount = silo.layerCount ?? 3;
  const activeNodes = silo.nodes.filter((n) => {
    if (n.active === false) return false;
    const layer = getLayerForY(n.position.y, layerCount);
    return isLayerMeasuring(layer, fillRatio, layerCount);
  });

  if (activeNodes.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Sin nodos activos</p>
      </div>
    );
  }

  const normalCount = activeNodes.filter((n) => n.status === 'normal').length;
  const warningCount = activeNodes.filter((n) => n.status === 'warning').length;
  const criticalCount = activeNodes.filter((n) => n.status === 'critical').length;

  const data = [
    { name: 'Normal', value: normalCount, color: '#22c55e' },
    { name: 'Advertencia', value: warningCount, color: '#eab308' },
    { name: 'Crítico', value: criticalCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '10px' }}
            formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
