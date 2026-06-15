import { User, Plant, Silo, SensorNode } from '@/types';
import usersJson from './json/users.json';
import plantsJson from './json/plants.json';
import silosJsonRaw from './json/silos.json';
import cerealesJson from './json/cereales.json';
import { Cereal } from '@/types';

export const mockUsers: User[] = usersJson as User[];
export const mockPlants: Plant[] = plantsJson as Plant[];
export const mockCereals: Cereal[] = cerealesJson as Cereal[];

function createWallNodesForSilo(siloId: string, layerCount: number = 3): SensorNode[] {
  const nodes: SensorNode[] = [];
  const siloR = 1.6;
  const siloH = 5.2;
  const margin = 0.15;
  const radius = siloR - margin;

  const angleCount = 4;
  const layerHeights: number[] = [];
  for (let i = 0; i < layerCount; i++) {
    layerHeights.push(-siloH / 2 + (siloH / (layerCount + 1)) * (i + 1));
  }

  let globalIndex = 0;
  for (let layer = 0; layer < layerCount; layer++) {
    for (let angleIdx = 0; angleIdx < angleCount; angleIdx++) {
      const angle = (angleIdx / angleCount) * Math.PI * 2 + (layer * Math.PI) / 4;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      const y = layerHeights[layer];

      nodes.push({
        id: `${siloId}-node-${globalIndex + 1}`,
        position: { x, y, z },
        metrics: {
          temperature: 15 + Math.random() * 2,
          humidity: 11 + Math.random() * 1.5,
          acousticLevel: 8 + Math.random() * 2,
        },
        status: 'normal',
      });
      globalIndex++;
    }
  }

  return nodes;
}

interface RawSilo {
  id: string;
  name: string;
  plantId: string;
  capacity: number;
  currentLevel: number;
  cerealType?: string;
  layerCount?: number;
}

export const mockSilos: Silo[] = (silosJsonRaw as RawSilo[]).map((raw) => ({
  id: raw.id,
  name: raw.name,
  plantId: raw.plantId,
  capacity: raw.capacity,
  currentLevel: raw.currentLevel,
  cerealType: raw.cerealType,
  layerCount: raw.layerCount || 3,
  nodes: createWallNodesForSilo(raw.id, raw.layerCount || 3),
}));
