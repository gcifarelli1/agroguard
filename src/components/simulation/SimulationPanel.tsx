import { useState, useEffect } from 'react';
import { useStore, getSilosForPlant } from '@/store/useStore';
import { AlertType, AnomalyIntensity } from '@/types';
import { cn } from '@/utils/helpers';
import { Zap, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export default function SimulationPanel() {
  const { silos, selectedPlantId, injectAnomaly, currentUser } = useStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [formData, setFormData] = useState({
    siloId: '',
    selectedNodeId: '',
    type: 'HEAT' as AlertType,
    intensity: 'HIGH' as AnomalyIntensity,
  });

  const visibleSilos = getSilosForPlant(silos, currentUser?.role === 'GLOBAL_ADMIN' ? selectedPlantId : currentUser?.plantId || '');

  // Keep siloId in sync with the visible silo list — reset when the selected silo is no longer visible.
  useEffect(() => {
    if (!visibleSilos.find((s) => s.id === formData.siloId)) {
      const defaultId = visibleSilos[0]?.id ?? '';
      setFormData((f) => ({ ...f, siloId: defaultId, selectedNodeId: '' }));
    }
  }, [visibleSilos]);

  const selectedSilo = silos.find((s) => s.id === formData.siloId);
  const activeNodes = selectedSilo?.nodes.filter((n) => n.active !== false) ?? [];

  // Keep selectedNodeId in sync when active nodes change.
  useEffect(() => {
    if (formData.selectedNodeId && !activeNodes.find((n) => n.id === formData.selectedNodeId)) {
      setFormData((f) => ({ ...f, selectedNodeId: activeNodes[0]?.id ?? '' }));
    } else if (!formData.selectedNodeId && activeNodes.length > 0) {
      setFormData((f) => ({ ...f, selectedNodeId: activeNodes[0].id }));
    }
  }, [activeNodes, formData.selectedNodeId]);

  const handleInject = () => {
    if (!selectedSilo || !formData.selectedNodeId) return;
    const nodeArrayIndex = selectedSilo.nodes.findIndex((n) => n.id === formData.selectedNodeId);
    if (nodeArrayIndex === -1) return;
    injectAnomaly({
      siloId: formData.siloId,
      x: nodeArrayIndex,
      y: 0,
      z: 0,
      type: formData.type,
      intensity: formData.intensity,
    });
  };

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
                onChange={(e) => setFormData({ ...formData, siloId: e.target.value, selectedNodeId: '' })}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {visibleSilos.map((s) => (
                  <option key={s.id} value={s.id}>{s.id}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs text-muted-foreground mb-1.5">Nodo</label>
              <select
                value={formData.selectedNodeId}
                onChange={(e) => setFormData({ ...formData, selectedNodeId: e.target.value })}
                disabled={activeNodes.length === 0}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeNodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.id}</option>
                ))}
              </select>
              {activeNodes.length === 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">Sin nodos activos en este silo.</p>
              )}
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
              {formData.selectedNodeId ? `${formData.selectedNodeId} - ${formData.type} - ${formData.intensity}` : 'Sin nodo seleccionado'}
            </p>
            <button
              onClick={handleInject}
              disabled={activeNodes.length === 0 || !formData.selectedNodeId}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                'bg-destructive/20 text-destructive hover:bg-destructive/30',
                'border border-destructive/50 hover:border-destructive',
                'disabled:opacity-40 disabled:cursor-not-allowed'
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
