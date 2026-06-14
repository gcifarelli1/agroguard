import { useStore, getSilosForPlant, getPlantName } from '@/store/useStore';
import { mockPlants } from '@/data/mockData';
import Sidebar from './Sidebar';
import Dashboard from '@/components/dashboard/Dashboard';
import { LogOut, RotateCcw, Activity, Wifi } from 'lucide-react';

interface MainLayoutProps {
  onNavigateToAdmin: () => void;
}

export default function MainLayout({ onNavigateToAdmin }: MainLayoutProps) {
  const { currentUser, selectedPlantId, selectedSiloId, silos, logout, resetMVP } = useStore();

  const visibleSilos = getSilosForPlant(
    silos,
    currentUser?.role === 'GLOBAL_ADMIN' ? selectedPlantId : currentUser?.plantId || ''
  );

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <header className="relative h-14 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
              <Activity className="w-4 h-4 text-primary" />
              <div className="absolute inset-0 rounded-lg border border-primary/50 animate-pulse opacity-50" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-foreground tracking-tight text-sm">AgroGuard</span>
              <span className="text-[8px] text-muted-foreground font-mono uppercase tracking-widest">AgroTwin System</span>
            </div>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs">
            <Wifi className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">
              {getPlantName(mockPlants, currentUser?.role === 'GLOBAL_ADMIN' ? selectedPlantId : currentUser?.plantId || '')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetMVP}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border hover:bg-accent hover:border-primary/30 transition-all text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="hidden sm:inline text-muted-foreground group-hover:text-foreground transition-colors">Reset</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
            </div>
            <span className="text-xs text-foreground font-medium">{currentUser?.name}</span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive group"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        <Sidebar silos={visibleSilos} selectedSiloId={selectedSiloId} onNavigateToAdmin={onNavigateToAdmin} />

        <main className="flex-1 p-4 overflow-auto relative">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}