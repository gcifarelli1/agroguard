import { SensorNode } from '@/types';
import { StoredNode } from '@/types';

export const SILO_R = 1.6;
export const SILO_H = 5.2;
export const MARGIN = 0.15;
export const ANGLES_PER_LAYER = 4;
export const MAX_NODES_PER_LAYER = 4;

/**
 * Maps a Y world-coordinate to its nearest layer index.
 * normalizedY: 0 = bottom, 1 = top.
 * Uses nearest-center rounding clamped to [0, layerCount-1].
 */
export function getLayerForY(y: number, layerCount: number): number {
  const normalizedY = (y + SILO_H / 2) / SILO_H;
  const raw = Math.round(normalizedY * (layerCount - 1));
  return Math.max(0, Math.min(layerCount - 1, raw));
}

/** Returns fresh baseline metrics matching the simulation baseline ranges. */
export function freshBaselineMetrics(): { temperature: number; humidity: number; acousticLevel: number } {
  return {
    temperature: 15 + Math.random() * 2,
    humidity: 11 + Math.random() * 1.5,
    acousticLevel: 8 + Math.random() * 2,
  };
}

/** Strips a SensorNode down to just its id and position for storage. */
export function toStoredNode(node: SensorNode): StoredNode {
  return { id: node.id, position: node.position };
}

/**
 * Reconstructs a full SensorNode from a stored snapshot.
 * siloId is accepted for future ID namespacing but not used since the id is
 * already embedded in the StoredNode.
 */
export function hydrateStoredNode(_siloId: string, stored: StoredNode): SensorNode {
  return {
    id: stored.id,
    position: stored.position,
    metrics: freshBaselineMetrics(),
    status: 'normal',
  };
}

/**
 * Generates wall-mounted sensor nodes for a silo cylinder.
 * Produces the EXACT same positions as the legacy duplicate in useStore.ts /
 * mockData.ts for identical inputs.
 */
export function createWallNodesForSilo(siloId: string, layerCount: number = 3): SensorNode[] {
  const nodes: SensorNode[] = [];
  const radius = SILO_R - MARGIN;

  const layerHeights: number[] = [];
  for (let i = 0; i < layerCount; i++) {
    layerHeights.push(-SILO_H / 2 + (SILO_H / (layerCount + 1)) * (i + 1));
  }

  let globalIndex = 0;
  for (let layer = 0; layer < layerCount; layer++) {
    for (let angleIdx = 0; angleIdx < ANGLES_PER_LAYER; angleIdx++) {
      const angle = (angleIdx / ANGLES_PER_LAYER) * Math.PI * 2 + (layer * Math.PI) / 4;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      const y = layerHeights[layer];

      nodes.push({
        id: `${siloId}-node-${globalIndex + 1}`,
        position: { x, y, z },
        metrics: freshBaselineMetrics(),
        status: 'normal',
      });
      globalIndex++;
    }
  }

  return nodes;
}
