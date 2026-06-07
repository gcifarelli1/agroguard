import { useStore } from '@/store/useStore';
import TrendChart from './Charts/TrendChart';
import DistributionChart from './Charts/DistributionChart';
import BioAcousticChart from './Charts/BioAcousticChart';
import AlertsFeed from './AlertsFeed';
import MetricsPanel from './MetricsPanel';
import StatusLegend from './StatusLegend';
import AgroTwinView from '@/components/agrotwin/AgroTwinView';
import SimulationPanel from '@/components/simulation/SimulationPanel';

export default function Dashboard() {
  const { selectedSiloId, silos } = useStore();
  const selectedSilo = silos.find((s) => s.id === selectedSiloId);

  if (!selectedSilo) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Selecciona un Silo</h2>
          <p className="text-muted-foreground text-sm">
            Elige un silo del panel lateral para visualizar su Gemelo Digital 3D y métricas en tiempo real.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4">
          <AgroTwinView silo={selectedSilo} />
        </div>
        <div className="space-y-4">
          <MetricsPanel silo={selectedSilo} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Tendencia Térmica (24h)</h3>
          <TrendChart silo={selectedSilo} />
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Distribución de Estados</h3>
          <DistributionChart silo={selectedSilo} />
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Actividad Bioacústica</h3>
          <BioAcousticChart silo={selectedSilo} />
        </div>
      </div>

      <AlertsFeed />

      <div className="flex flex-col gap-2">
        <StatusLegend />
        <SimulationPanel />
      </div>
    </div>
  );
}