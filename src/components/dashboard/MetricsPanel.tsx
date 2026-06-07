import { Silo } from '@/types';
import { THRESHOLDS } from '@/data/thresholds';
import { cn } from '@/utils/helpers';
import { Thermometer, Droplets, Volume2, AlertTriangle, Package } from 'lucide-react';

interface MetricsPanelProps {
  silo: Silo;
}

export default function MetricsPanel({ silo }: MetricsPanelProps) {
  const temps = silo.nodes.map((n) => n.metrics.temperature);
  const hums = silo.nodes.map((n) => n.metrics.humidity);
  const dbs = silo.nodes.map((n) => n.metrics.acousticLevel);
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const avgHum = hums.reduce((a, b) => a + b, 0) / hums.length;
  const avgDb = dbs.reduce((a, b) => a + b, 0) / dbs.length;

  const criticalCount = silo.nodes.filter((n) => n.status === 'critical').length;
  const warningCount = silo.nodes.filter((n) => n.status === 'warning').length;
  const normalCount = silo.nodes.length - criticalCount - warningCount;

  const fillPercent = Math.round((silo.currentLevel / silo.capacity) * 100);

  const getStatusInfo = (value: number, optimal: number, warning: number) => {
    if (value > warning) return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', ring: 'ring-destructive/20' };
    if (value > optimal) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', ring: 'ring-yellow-500/20' };
    return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', ring: 'ring-primary/20' };
  };

  const tempInfo = getStatusInfo(avgTemp, THRESHOLDS.temperature.optimal, THRESHOLDS.temperature.warning);
  const humInfo = getStatusInfo(avgHum, THRESHOLDS.humidity.optimal, THRESHOLDS.humidity.warning);
  const dbInfo = getStatusInfo(avgDb, THRESHOLDS.acousticLevel.optimal, THRESHOLDS.acousticLevel.warning);

  const metrics = [
    {
      icon: Thermometer,
      label: 'Temp Promedio',
      value: `${avgTemp.toFixed(1)}°C`,
      sublabel: avgTemp > THRESHOLDS.temperature.warning ? 'Crítico' : avgTemp > THRESHOLDS.temperature.optimal ? 'Alerta' : 'Óptimo',
      ...tempInfo,
    },
    {
      icon: Droplets,
      label: 'Humedad Promedio',
      value: `${avgHum.toFixed(1)}%`,
      sublabel: avgHum > THRESHOLDS.humidity.warning ? 'Crítico' : avgHum > THRESHOLDS.humidity.optimal ? 'Alerta' : 'Óptimo',
      ...humInfo,
    },
    {
      icon: Volume2,
      label: 'Ruido Promedio',
      value: `${avgDb.toFixed(1)} dB`,
      sublabel: avgDb > THRESHOLDS.acousticLevel.warning ? 'Crítico' : avgDb > THRESHOLDS.acousticLevel.optimal ? 'Alerta' : 'Óptimo',
      ...dbInfo,
    },
    {
      icon: Package,
      label: 'Capacidad',
      value: `${fillPercent}%`,
      sublabel: `${silo.currentLevel.toLocaleString()} / ${silo.capacity.toLocaleString()} t`,
      color: 'text-foreground',
      bg: 'bg-accent/30',
      border: 'border-border',
      ring: 'ring-border/30',
    },
  ];

  return (
    <div className="bg-card/60 backdrop-blur rounded-xl border border-border p-4 h-full flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />

      <div className="relative">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          {silo.name}
        </h3>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
          {silo.id} · {fillPercent}% cargado
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 relative">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={cn(
              'group relative p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02]',
              metric.bg,
              metric.border,
              'hover:shadow-lg'
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <metric.icon className={cn('w-4 h-4', metric.color)} />
              <span className={cn(
                'text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded',
                metric.sublabel === 'Crítico' ? 'bg-destructive/20 text-destructive' :
                metric.sublabel === 'Alerta' ? 'bg-yellow-500/20 text-yellow-500' :
                metric.sublabel === 'Óptimo' ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              )}>
                {metric.sublabel}
              </span>
            </div>
            <p className={cn('text-xl font-bold leading-tight', metric.color)}>
              {metric.value}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {metric.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-border/50 relative">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Distribución de Sensores
          </span>
          {(criticalCount > 0 || warningCount > 0) && (
            <span className="flex items-center gap-1 text-[10px] text-yellow-500 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount + warningCount}
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {[
            { label: 'Normal', count: normalCount, color: 'bg-primary', textColor: 'text-primary' },
            { label: 'Alert', count: warningCount, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
            { label: 'Crit', count: criticalCount, color: 'bg-destructive', textColor: 'text-destructive' },
          ].map((item) => (
            <div key={item.label} className="flex-1">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-muted-foreground font-mono">{item.label}</span>
                <span className={cn('font-bold', item.textColor)}>{item.count}</span>
              </div>
              <div className="h-1.5 bg-accent/50 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500 ease-out', item.color)}
                  style={{ width: `${(item.count / silo.nodes.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}