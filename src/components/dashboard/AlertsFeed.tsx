import { useStore } from '@/store/useStore';
import { cn } from '@/utils/helpers';
import { AlertTriangle, CheckCircle2, Clock, Wind, Bug, Loader2, Activity, Zap } from 'lucide-react';

export default function AlertsFeed() {
  const { alerts, applyMitigation } = useStore();

  const activeAlerts = alerts.filter((a) => a.status !== 'resolved').slice(0, 3);
  const recentResolved = alerts.filter((a) => a.status === 'resolved').slice(0, 5);

  const getAlertTypeLabel = (type: string) => {
    if (type === 'HEAT') return { label: 'Calor excesivo', icon: Zap, color: 'text-red-400' };
    if (type === 'HUMIDITY') return { label: 'Humedad crítica', icon: Activity, color: 'text-blue-400' };
    return { label: 'Actividad biológica', icon: Bug, color: 'text-purple-400' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card/60 backdrop-blur rounded-xl border border-border p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-destructive/10">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            </div>
            Alertas Activas
            {activeAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-bold font-mono">
                {activeAlerts.length}
              </span>
            )}
          </h3>
        </div>

        <div className="space-y-2.5 relative">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Sin alertas activas</p>
              <p className="text-[10px] text-muted-foreground mt-1">Todos los sensores en rango óptimo</p>
            </div>
          ) : (
            activeAlerts.map((alert) => {
              const typeInfo = getAlertTypeLabel(alert.type);
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'group relative p-3 rounded-lg border transition-all duration-300',
                    'hover:translate-x-0.5',
                    alert.severity === 'critical'
                      ? 'bg-destructive/5 border-destructive/30 hover:border-destructive/50'
                      : 'bg-yellow-500/5 border-yellow-500/30 hover:border-yellow-500/50'
                  )}
                >
                  {alert.severity === 'critical' && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <typeInfo.icon className={cn('w-3.5 h-3.5', typeInfo.color)} />
                      <span className="font-semibold text-xs text-foreground">
                        {typeInfo.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(alert.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">
                    {alert.message}
                  </p>

                  {alert.status === 'resolving' ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Resolviendo...
                    </div>
                  ) : (
                    <button
                      onClick={() => applyMitigation(alert.id, 'ventilate')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all',
                        'hover:scale-[1.02] active:scale-95',
                        alert.type === 'BIO_ACOUSTIC'
                          ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20'
                          : 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20'
                      )}
                    >
                      {alert.type === 'BIO_ACOUSTIC' ? (
                        <>
                          <Bug className="w-3 h-3" />
                          Aplicar Tratamiento
                        </>
                      ) : (
                        <>
                          <Wind className="w-3 h-3" />
                          Activar Ventilación
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-card/60 backdrop-blur rounded-xl border border-border p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <h3 className="relative text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          </div>
          Historial Reciente
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">
            {alerts.length} total
          </span>
        </h3>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 relative">
          {recentResolved.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
                <Activity className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-xs">Sin alertas resueltas aún</p>
            </div>
          ) : (
            recentResolved.map((alert) => {
              const typeInfo = getAlertTypeLabel(alert.type);
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-2.5 p-2 rounded-md bg-secondary/20 hover:bg-secondary/40 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground truncate font-medium">
                      {typeInfo.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-mono">
                      {alert.resolvedBy ? `${alert.resolvedBy} · ` : ''}{alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}