import { useState, useEffect } from 'react';
import { Silo } from '@/types';
import { THRESHOLDS } from '@/data/thresholds';
import { cn } from '@/utils/helpers';
import { Thermometer, Droplets, Volume2, AlertTriangle, Package } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface MetricsPanelProps {
  silo: Silo;
}

export default function MetricsPanel({ silo }: MetricsPanelProps) {
  const { selectedNode, toggleNodeActive } = useStore();
  const [pendingDeactivate, setPendingDeactivate] = useState(false);

  const activeNodes = silo.nodes.filter((n) => n.active !== false);
  const temps = activeNodes.map((n) => n.metrics.temperature);
  const hums = activeNodes.map((n) => n.metrics.humidity);
  const dbs = activeNodes.map((n) => n.metrics.acousticLevel);
  const avgTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
  const avgHum = hums.length ? hums.reduce((a, b) => a + b, 0) / hums.length : 0;
  const avgDb = dbs.length ? dbs.reduce((a, b) => a + b, 0) / dbs.length : 0;

  const criticalCount = activeNodes.filter((n) => n.status === 'critical').length;
  const warningCount = activeNodes.filter((n) => n.status === 'warning').length;
  const normalCount = activeNodes.length - criticalCount - warningCount;

  const fillPercent = Math.round((silo.currentLevel / silo.capacity) * 100);

  // Reset pending confirmation when selected node changes.
  useEffect(() => {
    setPendingDeactivate(false);
  }, [selectedNode]);

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

      {/* Selected node toggle — rendered ABOVE the distribution bars */}
      {selectedNode && silo.nodes.some((n) => n.id === selectedNode.id) && (() => {
        const node = silo.nodes.find((n) => n.id === selectedNode.id)!;
        const isActive = node.active !== false;
        return (
          <div className="pt-3 border-t border-border/50 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Nodo seleccionado
                </p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{node.id}</p>
              </div>
              {pendingDeactivate ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">¿Desactivar nodo?</span>
                  <button
                    onClick={() => { toggleNodeActive(silo.id, node.id); setPendingDeactivate(false); }}
                    className="text-destructive font-medium hover:underline"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setPendingDeactivate(false)}
                    className="text-muted-foreground hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => {
                    if (isActive) {
                      setPendingDeactivate(true);
                    } else {
                      toggleNodeActive(silo.id, node.id);
                    }
                  }}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isActive ? 'bg-primary' : 'bg-accent',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200',
                      isActive ? 'translate-x-4' : 'translate-x-0',
                    )}
                  />
                </button>
              )}
            </div>
            <p className={cn(
              'text-[10px] font-mono mt-1',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}>
              {isActive ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        );
      })()}

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
                  style={{ width: activeNodes.length ? `${(item.count / activeNodes.length) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
