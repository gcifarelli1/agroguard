import { Silo } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DistributionChartProps {
  silo: Silo;
}

export default function DistributionChart({ silo }: DistributionChartProps) {
  const normalCount = silo.nodes.filter((n) => n.status === 'normal').length;
  const warningCount = silo.nodes.filter((n) => n.status === 'warning').length;
  const criticalCount = silo.nodes.filter((n) => n.status === 'critical').length;

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
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px' }}
            formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}