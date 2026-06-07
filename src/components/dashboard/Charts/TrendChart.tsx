import { Silo } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

interface TrendChartProps {
  silo: Silo;
}

export default function TrendChart({ silo }: TrendChartProps) {
  const data = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 12 }, (_, i) => {
      const time = new Date(now - (11 - i) * 60000);
      const baseTemp = 17 + Math.sin(i * 0.5) * 2;
      const baseHum = 12 + Math.cos(i * 0.3) * 1;
      return {
        time: time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        temperature: parseFloat((baseTemp + (Math.random() - 0.5)).toFixed(1)),
        humidity: parseFloat((baseHum + (Math.random() - 0.5) * 0.5).toFixed(1)),
      };
    });
  }, [silo.id]);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            domain={[10, 30]}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="Temp (°C)"
          />
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Hum (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}