import { useState } from 'react';
import { useStore, getSilosForPlant } from '@/store/useStore';
import { AlertType, AnomalyIntensity } from '@/types';
import { cn } from '@/utils/helpers';
import { Zap, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export default function SimulationPanel() {
  const { silos, selectedPlantId, injectAnomaly, currentUser } = useStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [formData, setFormData] = useState({
    siloId: 'SILO_J1',
    nodeIndex: 0,
    type: 'HEAT' as AlertType,
    intensity: 'HIGH' as AnomalyIntensity,
  });

  const visibleSilos = getSilosForPlant(silos, currentUser?.role === 'GLOBAL_ADMIN' ? selectedPlantId : currentUser?.plantId || '');

  const handleInject = () => {
    injectAnomaly({
      siloId: formData.siloId,
      x: formData.nodeIndex,
      y: 0,
      z: 0,
      type: formData.type,
      intensity: formData.intensity,
    });
  };

  const selectedSilo = silos.find((s) => s.id === formData.siloId);
  const totalNodes = selectedSilo?.nodes.length || 12;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Zap className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Inyección Avanzada de Anomalías
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Demostración: Simula crisis en nodos específicos del silo
            </p>
          </div>
        </div>
        {isMinimized ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {!isMinimized && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="block text-xs text-muted-foreground mb-1.5">Silo</label>
              <select
                value={formData.siloId}
                onChange={(e) => setFormData({ ...formData, siloId: e.target.value, nodeIndex: 0 })}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {visibleSilos.map((s) => (
                  <option key={s.id} value={s.id}>{s.id}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs text-muted-foreground mb-1.5">Nodo (1-{totalNodes})</label>
              <select
                value={formData.nodeIndex}
                onChange={(e) => setFormData({ ...formData, nodeIndex: parseInt(e.target.value) })}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {Array.from({ length: totalNodes }, (_, i) => (
                  <option key={i} value={i}>Nodo {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertType })}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="HEAT">Calor</option>
                <option value="HUMIDITY">Humedad</option>
                <option value="BIO_ACOUSTIC">Plaga</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs text-muted-foreground mb-1.5">Intensidad</label>
              <select
                value={formData.intensity}
                onChange={(e) => setFormData({ ...formData, intensity: e.target.value as AnomalyIntensity })}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Nodo {formData.nodeIndex + 1} de {totalNodes} - {formData.type} - {formData.intensity}
            </p>
            <button
              onClick={handleInject}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                'bg-destructive/20 text-destructive hover:bg-destructive/30',
                'border border-destructive/50 hover:border-destructive'
              )}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              INYECTAR ANOMALÍA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}