import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { Silo, SensorNode } from '@/types';
import { useStore } from '@/store/useStore';
import { cn } from '@/utils/helpers';
import { THRESHOLDS } from '@/data/thresholds';
import { getLayerForY } from '@/utils/nodeGeometry';
import { MousePointer, Pause, Play } from 'lucide-react';
import * as THREE from 'three';

interface AgroTwinViewProps {
  silo: Silo;
}

const SILO_RADIUS = 1.6;
const SILO_HEIGHT = 5.2;

function getNodeColor(node: SensorNode, disabled: boolean): string {
  if (node.active === false) return '#6b7280';
  if (disabled) return '#4a5568';
  if (node.status === 'critical') return '#ef4444';
  if (node.status === 'warning') return '#eab308';
  return '#22c55e';
}

function CameraControls({ isRotating }: { isRotating: boolean }) {
  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={4}
      maxDistance={18}
      autoRotate={isRotating}
      autoRotateSpeed={1.5}
    />
  );
}

function isLayerActive(layerIndex: number, fillRatio: number, layerCount: number): boolean {
  if (fillRatio <= 0) return false;
  if (layerIndex === 0) return true;
  return fillRatio >= layerIndex / layerCount;
}

class TooltipBoundary extends React.Component<{ children: React.ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? null : this.props.children; }
}

function SiloMesh({
  silo,
  onNodeClick,
  selectedNodeId,
}: {
  silo: Silo;
  onNodeClick: (node: SensorNode) => void;
  selectedNodeId: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const fillRatio = silo.currentLevel / silo.capacity;
  const layerCount = silo.layerCount ?? 3;

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[SILO_RADIUS, SILO_RADIUS, SILO_HEIGHT, 32, 1, true]} />
        <meshStandardMaterial
          color="#1a1a2e"
          transparent
          opacity={0.2}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, -SILO_HEIGHT / 2 + 0.05, 0]}>
        <cylinderGeometry args={[SILO_RADIUS, SILO_RADIUS, 0.1, 32]} />
        <meshStandardMaterial color="#2a2a4e" />
      </mesh>

      <mesh position={[0, SILO_HEIGHT / 2 - 0.05, 0]}>
        <cylinderGeometry args={[SILO_RADIUS, SILO_RADIUS, 0.1, 32]} />
        <meshStandardMaterial color="#2a2a4e" />
      </mesh>

      {silo.nodes.map((node) => {
        const layer = getLayerForY(node.position.y, layerCount);
        const layerActive = isLayerActive(layer, fillRatio, layerCount);
        const nodeDisabled = !layerActive;
        return (
          <mesh
            key={node.id}
            position={[node.position.x, node.position.y, node.position.z]}
            onClick={(e) => {
              e.stopPropagation();
              if (layerActive && node.active !== false) onNodeClick(node);
            }}
          >
            <sphereGeometry args={[0.28, 16, 16]} />
            <meshStandardMaterial
              color={getNodeColor(node, nodeDisabled)}
              emissive={selectedNodeId === node.id ? '#ffffff' : getNodeColor(node, nodeDisabled)}
              emissiveIntensity={selectedNodeId === node.id ? 0.6 : 0.2}
            />
          </mesh>
        );
      })}

      {fillRatio > 0 && (
        <mesh position={[0, -SILO_HEIGHT / 2 + (SILO_HEIGHT * fillRatio) / 2, 0]}>
          <cylinderGeometry args={[SILO_RADIUS * 0.98, SILO_RADIUS * 0.98, SILO_HEIGHT * fillRatio, 32]} />
          <meshStandardMaterial
            color="#d4a574"
            transparent
            opacity={0.35}
          />
        </mesh>
      )}
    </group>
  );
}

function NodeTooltip({ node, layerCount }: { node: SensorNode; layerCount: number }) {
  return (
    <Html distanceFactor={12} position={[node.position.x + 1.5, node.position.y, node.position.z]}>
      <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl min-w-[160px] pointer-events-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-primary">{node.id}</span>
          <span className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            node.status === 'critical' ? 'bg-destructive/20 text-destructive' :
            node.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
            'bg-primary/20 text-primary'
          )}>
            {node.status === 'critical' ? 'Crítico' : node.status === 'warning' ? 'Advertencia' : 'Normal'}
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temp:</span>
            <span className={cn(
              'font-medium',
              node.metrics.temperature > THRESHOLDS.temperature.warning ? 'text-destructive' :
              node.metrics.temperature > THRESHOLDS.temperature.optimal ? 'text-yellow-500' : 'text-foreground'
            )}>
              {node.metrics.temperature.toFixed(1)}°C
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hum:</span>
            <span className={cn(
              'font-medium',
              node.metrics.humidity > THRESHOLDS.humidity.warning ? 'text-destructive' :
              node.metrics.humidity > THRESHOLDS.humidity.optimal ? 'text-yellow-500' : 'text-foreground'
            )}>
              {node.metrics.humidity.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">dB:</span>
            <span className={cn(
              'font-medium',
              node.metrics.acousticLevel > THRESHOLDS.acousticLevel.warning ? 'text-destructive' :
              node.metrics.acousticLevel > THRESHOLDS.acousticLevel.optimal ? 'text-yellow-500' : 'text-foreground'
            )}>
              {node.metrics.acousticLevel.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
          Capa {getLayerForY(node.position.y, layerCount) + 1} | Pos: ({node.position.x.toFixed(1)}, {node.position.y.toFixed(1)}, {node.position.z.toFixed(1)})
        </div>
      </div>
    </Html>
  );
}

function Scene({
  silo,
  onNodeClick,
  selectedNode,
  selectedNodeId,
  isRotating,
}: {
  silo: Silo;
  onNodeClick: (node: SensorNode) => void;
  selectedNode: SensorNode | null;
  selectedNodeId: string | null;
  isRotating: boolean;
}) {
  const layerCount = silo.layerCount ?? 3;
  const fillRatio = silo.currentLevel / silo.capacity;

  // Resolve tooltip node fresh from silo data to avoid stale selectedNode reference.
  const tooltipNode = silo.nodes.find((n) => n.id === selectedNode?.id);
  const tooltipLayer = tooltipNode != null ? getLayerForY(tooltipNode.position.y, layerCount) : -1;
  const tooltipLayerActive = tooltipLayer >= 0 && isLayerActive(tooltipLayer, fillRatio, layerCount);
  const showTooltip = tooltipNode != null && tooltipLayerActive && tooltipNode.active !== false;

  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 2, 6]} fov={50} />
      <CameraControls isRotating={isRotating} />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-8, -5, -8]} intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} />
      <fog attach="fog" args={['#0a0f1a', 15, 30]} />

      <SiloMesh
        silo={silo}
        onNodeClick={onNodeClick}
        selectedNodeId={selectedNodeId}
      />

      {showTooltip && (
        <TooltipBoundary>
          <NodeTooltip node={tooltipNode} layerCount={layerCount} />
        </TooltipBoundary>
      )}
    </>
  );
}

export default function AgroTwinView({ silo }: AgroTwinViewProps) {
  const { selectedNode, setSelectedNode } = useStore();
  const [isRotating, setIsRotating] = useState(true);

  const handleNodeClick = useCallback((node: SensorNode) => {
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
    }
  }, [selectedNode, setSelectedNode]);

  const fillRatio = silo.currentLevel / silo.capacity;
  const fillPercent = Math.round(fillRatio * 100);
  const layerCount = silo.layerCount ?? 3;

  const layerInfo = useMemo(() => {
    return Array.from({ length: layerCount }, (_, i) => {
      const active = isLayerActive(i, fillRatio, layerCount);
      const label = i === 0 ? 'Capa 1 (Base)' : i === layerCount - 1 ? `Capa ${i + 1} (Tope)` : `Capa ${i + 1}`;
      return { label, active };
    });
  }, [fillRatio, layerCount]);

  return (
    <div className="relative h-[400px] w-full bg-gradient-to-b from-accent/20 to-background rounded-lg overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-card/80 backdrop-blur border border-border text-xs font-medium text-foreground">
          AgroTwin 3D
        </span>
        <span className="px-2 py-1 rounded bg-card/80 backdrop-blur border border-border text-xs text-muted-foreground">
          {silo.name}
        </span>
        <span className="px-2 py-1 rounded bg-card/80 backdrop-blur border border-border text-xs font-mono text-primary">
          {silo.nodes.length} nodos
        </span>
        <span className="px-2 py-1 rounded bg-card/80 backdrop-blur border border-border text-xs font-mono text-yellow-500">
          {fillPercent}% lleno
        </span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-card/80 backdrop-blur border border-border rounded-lg p-2">
        {layerInfo.map((layer, idx) => (
          <div key={idx} className="flex items-center gap-2 text-[10px]">
            <span className={cn(
              'w-2 h-2 rounded-full',
              layer.active ? 'bg-primary' : 'bg-gray-500'
            )} />
            <span className={cn(
              'font-mono',
              layer.active ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {layer.label}
            </span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 z-10 flex gap-2">
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={cn(
            'p-2 rounded-lg border transition-all duration-300 hover:scale-105 active:scale-95',
            isRotating
              ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_12px_rgba(34,197,94,0.2)]'
              : 'bg-card/80 backdrop-blur border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
          )}
          title={isRotating ? 'Pausar rotación' : 'Reanudar rotación'}
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/60 backdrop-blur border border-border/50">
        <MousePointer className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-mono">Clic en nodo</span>
      </div>

      <Canvas
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene
          silo={silo}
          onNodeClick={handleNodeClick}
          selectedNode={selectedNode}
          selectedNodeId={selectedNode?.id || null}
          isRotating={isRotating}
        />
      </Canvas>
    </div>
  );
}
