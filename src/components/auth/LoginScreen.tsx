import { mockUsers, mockPlants } from '@/data/mockData';
import { useStore } from '@/store/useStore';
import { Shield, Building2, User, ArrowRight, Cpu } from 'lucide-react';
import { cn } from '@/utils/helpers';

export default function LoginScreen() {
  const { setCurrentUser } = useStore();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.05),transparent_50%)]" />
      </div>

      <div className="w-full max-w-lg relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-5 relative border border-primary/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <Shield className="w-9 h-9 text-primary" />
            <div className="absolute inset-0 rounded-2xl border border-primary/40 animate-pulse opacity-30" />
          </div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight mb-2 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text">
            AgroGuard
          </h1>
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Cpu className="w-3.5 h-3.5" />
            Sistema de Gemelo Digital · Silos de Acopio
          </p>
        </div>

        <div className="bg-card/60 backdrop-blur-md rounded-2xl border border-border p-6 shadow-2xl relative">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Seleccionar Usuario de Prueba
          </h2>
          <p className="text-[11px] text-muted-foreground mb-5 font-mono uppercase tracking-wider">
            Autenticación Mock · {mockPlants.length} Plantas
          </p>

          <div className="space-y-2.5">
            {mockUsers.map((user, idx) => (
              <button
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className={cn(
                  'group w-full p-4 rounded-xl border border-border bg-gradient-to-r from-secondary/40 to-secondary/20',
                  'hover:from-accent hover:to-accent/50 hover:border-primary/40 transition-all duration-300',
                  'text-left relative overflow-hidden'
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" />
                      {user.role === 'GLOBAL_ADMIN' ? 'Acceso multi-planta' : `Planta: ${user.plantId}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-1 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider',
                      user.role === 'GLOBAL_ADMIN'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-accent text-muted-foreground border border-border'
                    )}>
                      {user.role === 'PLANT_MANAGER' ? 'Gerente' : 'Admin'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-muted-foreground text-[10px] mt-6 font-mono uppercase tracking-widest">
          MVP Demo · Datos simulados en tiempo real
        </p>
      </div>
    </div>
  );
}