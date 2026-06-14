import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Silo, SensorNode } from '@/types';
import { cn } from '@/utils/helpers';
import { Layers, Plus, Trash2, X } from 'lucide-react';

interface SiloNodeEditorProps {
  silo: Silo;
  onClose: () => void;
}

function getLayerIndex(y: number, siloH: number = 5.2): number {
  const normalized = (y + siloH / 2) / siloH;
  if (normalized < 0.33) return 0;
  if (normalized < 0.66) return 1;
  return 2;
}

function getLayerLabel(layerIndex: number, totalLayers: number): string {
  if (totalLayers === 2) return layerIndex === 0 ? 'Capa 1 (Base)' : 'Capa 2 (Tope)';
  if (layerIndex === 0) return 'Capa 1 (Base) 0-33%';
  if (layerIndex === totalLayers - 1) return `Capa ${layerIndex + 1} (Tope)`;
  return `Capa ${layerIndex + 1}`;
}

export default function SiloNodeEditor({ silo, onClose }: SiloNodeEditorProps) {
  const { addNodeToSilo, removeNodeFromSilo } = useStore();
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalLayers = silo.layerCount || 3;
  const siloH = 5.2;

  const nodesByLayer: Record<number, SensorNode[]> = {};
  for (let i = 0; i < totalLayers; i++) nodesByLayer[i] = [];
  silo.nodes.forEach((node) => {
    const layer = getLayerIndex(node.position.y, siloH);
    if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
    nodesByLayer[layer].push(node);
  });

  const handleAddNode = () => {
    if (selectedLayer < 0 || selectedLayer >= totalLayers) return;
    addNodeToSilo(silo.id, selectedLayer);
  };

  const handleRemoveNode = (nodeId: string) => {
    removeNodeFromSilo(silo.id, nodeId);
    setConfirmDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Configurar Nodos</h3>
              <p className="text-[10px] text-muted-foreground font-mono">{silo.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Layer selector */}
        <div className="px-4 py-3 border-b border-border bg-card/40 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">
              Seleccionar Capa:
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalLayers }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedLayer(i)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                    selectedLayer === i
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-secondary/40 text-muted-foreground border border-transparent hover:text-foreground'
                  )}
                >
                  {getLayerLabel(i, totalLayers)}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <button
                onClick={handleAddNode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-[10px] font-medium transition-all hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-3 h-3" />
                Agregar Nodo
              </button>
            </div>
          </div>
        </div>

        {/* Nodes grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {totalLayers === 0 || (nodesByLayer[selectedLayer]?.length || 0) === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Layers className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-xs font-medium">Sin nodos en esta capa</p>
              <p className="text-[10px] mt-1">Hacé click en "Agregar Nodo" para añadir el primero</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                {getLayerLabel(selectedLayer, totalLayers)} — {nodesByLayer[selectedLayer]?.length || 0} nodos
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(nodesByLayer[selectedLayer] || []).map((node) => (
                  <div
                    key={node.id}
                    className="relative p-3 rounded-lg border bg-secondary/20 border-border hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-semibold text-foreground">{node.id}</span>
                      {confirmDelete === node.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveNode(node.id)}
                            className="px-2 py-0.5 rounded bg-destructive/20 text-destructive text-[10px] font-medium hover:bg-destructive/30 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium hover:bg-accent transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(node.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar nodo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Temp:</span>
                        <span className="font-mono text-foreground">{node.metrics.temperature.toFixed(1)}°C</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Hum:</span>
                        <span className="font-mono text-foreground">{node.metrics.humidity.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">dB:</span>
                        <span className="font-mono text-foreground">{node.metrics.acousticLevel.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] mt-1 pt-1 border-t border-border/50">
                        <span className="text-muted-foreground">Pos:</span>
                        <span className="font-mono text-muted-foreground text-[9px]">
                          ({node.position.x.toFixed(2)}, {node.position.y.toFixed(2)}, {node.position.z.toFixed(2)})
                        </span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'mt-2 w-full h-1 rounded-full',
                        node.status === 'critical' ? 'bg-destructive' :
                        node.status === 'warning' ? 'bg-yellow-500' : 'bg-primary'
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-card/40 shrink-0">
          <p className="text-[9px] text-muted-foreground font-mono text-center">
            Los nodos se distribuyen automáticamente en la pared del cilindro. Al agregar, se recalculan las posiciones de todos los nodos de la capa.
          </p>
        </div>
      </div>
    </div>
  );
}