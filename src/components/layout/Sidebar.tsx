import { Silo } from '@/types';
import { useStore } from '@/store/useStore';
import { mockPlants } from '@/data/mockData';
import { THRESHOLDS } from '@/data/thresholds';
import { cn } from '@/utils/helpers';
import { Thermometer, Droplets, Volume2, ChevronDown, MapPin, Building2, Shield } from 'lucide-react';

interface SidebarProps {
  silos: Silo[];
  selectedSiloId: string | null;
  onNavigateToAdmin: () => void;
}

function getSiloAvgMetrics(silo: Silo) {
  const temps = silo.nodes.map((n) => n.metrics.temperature);
  const hums = silo.nodes.map((n) => n.metrics.humidity);
  const dbs = silo.nodes.map((n) => n.metrics.acousticLevel);
  return {
    temperature: temps.reduce((a, b) => a + b, 0) / temps.length,
    humidity: hums.reduce((a, b) => a + b, 0) / hums.length,
    acousticLevel: dbs.reduce((a, b) => a + b, 0) / dbs.length,
  };
}

export default function Sidebar({ silos, selectedSiloId, onNavigateToAdmin }: SidebarProps) {
  const { currentUser, selectedPlantId, setSelectedPlantId, setSelectedSiloId } = useStore();

  return (
    <aside className="w-72 border-r border-border bg-card/30 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto relative">
      {currentUser?.role === 'GLOBAL_ADMIN' && (
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            Filtrar Planta
          </label>
          <div className="relative">
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              className="w-full appearance-none bg-secondary/40 border border-border rounded-lg px-3 py-2 pr-8 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
            >
              {mockPlants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">
            Silos
          </label>
          <span className="text-[10px] font-mono text-muted-foreground">
            {silos.length}
          </span>
        </div>

        <div className="space-y-2">
          {silos.map((silo) => {
            const metrics = getSiloAvgMetrics(silo);
            const status = metrics.temperature > THRESHOLDS.temperature.warning || metrics.humidity > THRESHOLDS.humidity.warning || metrics.acousticLevel > THRESHOLDS.acousticLevel.warning ? 'critical' : metrics.temperature > THRESHOLDS.temperature.optimal || metrics.humidity > THRESHOLDS.humidity.optimal || metrics.acousticLevel > THRESHOLDS.acousticLevel.optimal ? 'warning' : 'normal';
            const isSelected = selectedSiloId === silo.id;
            const fillPct = Math.round((silo.currentLevel / silo.capacity) * 100);

            return (
              <button
                key={silo.id}
                onClick={() => setSelectedSiloId(silo.id)}
                className={cn(
                  'group relative w-full p-3 rounded-lg border transition-all duration-300 text-left overflow-hidden',
                  isSelected
                    ? 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40 shadow-[0_0_12px_rgba(34,197,94,0.1)]'
                    : 'bg-secondary/20 border-border hover:bg-accent/40 hover:border-primary/20'
                )}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/0 via-primary to-primary/0" />
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-foreground truncate flex-1">{silo.name}</span>
                  <span className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0 ml-2',
                    status === 'critical' ? 'bg-destructive animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
                    status === 'warning' ? 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)]' :
                    'bg-primary shadow-[0_0_6px_rgba(34,197,94,0.5)]'
                  )} />
                </div>

                <div className="space-y-1">
                  {[
                    { icon: Thermometer, val: metrics.temperature, unit: '°C', threshold: THRESHOLDS.temperature },
                    { icon: Droplets, val: metrics.humidity, unit: '%', threshold: THRESHOLDS.humidity },
                    { icon: Volume2, val: metrics.acousticLevel, unit: '', threshold: THRESHOLDS.acousticLevel },
                  ].map(({ icon: Icon, val, unit, threshold }) => {
                    const color = val > threshold.warning ? 'text-destructive' : val > threshold.optimal ? 'text-yellow-500' : 'text-foreground';
                    return (
                      <div key={unit} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Icon className="w-2.5 h-2.5" />
                        </div>
                        <span className={cn('font-mono font-medium', color)}>
                          {val.toFixed(1)}{unit}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 space-y-0.5">
                  <div className="h-1 bg-accent/40 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        status === 'critical' ? 'bg-gradient-to-r from-destructive to-destructive/60' :
                        status === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-500/60' :
                        'bg-gradient-to-r from-primary to-primary/60'
                      )}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground font-mono">
                    {fillPct}% · {silo.id}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onNavigateToAdmin}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:from-primary/20 hover:to-primary/10 transition-all text-xs text-foreground group"
      >
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="font-medium">Panel de Administración</span>
      </button>

      <div className="mt-auto pt-3 border-t border-border/50 space-y-1.5">
        <div className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Building2 className="w-3 h-3" />
          Plantas
        </div>
        {mockPlants.map((plant) => (
          <div key={plant.id} className="flex items-center gap-2 text-[10px] group">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              plant.id === 'PLANT_TANDIL' ? 'bg-blue-500' : 'bg-purple-500'
            )} />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{plant.name}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}