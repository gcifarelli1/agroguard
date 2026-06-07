import { User, Plant, Silo, SensorNode } from '@/types';

export const mockUsers: User[] = [
  { id: 'u-01', name: 'Gerente Tandil', role: 'PLANT_MANAGER', plantId: 'PLANT_TANDIL' },
  { id: 'u-02', name: 'Gerente Benito Juárez', role: 'PLANT_MANAGER', plantId: 'PLANT_JUAREZ' },
  { id: 'u-03', name: 'Administrador Global', role: 'GLOBAL_ADMIN', plantId: 'ALL' },
];

export const mockPlants: Plant[] = [
  { id: 'PLANT_TANDIL', name: 'Sede Central Tandil', silos: ['SILO_T1', 'SILO_T2', 'SILO_T3', 'SILO_T4'] },
  { id: 'PLANT_JUAREZ', name: 'Sucursal Benito Juárez', silos: ['SILO_J1', 'SILO_J2'] },
];

function createWallNodesForSilo(siloId: string): SensorNode[] {
  const nodes: SensorNode[] = [];
  const siloR = 1.6;
  const siloH = 5.2;
  const margin = 0.15;
  const radius = siloR - margin;

  const angleCount = 4;
  const layers = 3;
  const layerHeights = [-siloH / 2 + 0.8, -siloH / 2 + 2.2, -siloH / 2 + 3.8];

  let globalIndex = 0;
  for (let layer = 0; layer < layers; layer++) {
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

export const mockSilos: Silo[] = [
  {
    id: 'SILO_T1',
    name: 'Silo Principal - Trigo',
    plantId: 'PLANT_TANDIL',
    capacity: 5000,
    currentLevel: 4200,
    nodes: createWallNodesForSilo('SILO_T1'),
  },
  {
    id: 'SILO_T2',
    name: 'Silo Secundario - Maíz',
    plantId: 'PLANT_TANDIL',
    capacity: 3000,
    currentLevel: 2400,
    nodes: createWallNodesForSilo('SILO_T2'),
  },
  {
    id: 'SILO_T3',
    name: 'Silo Auxiliar - Soja',
    plantId: 'PLANT_TANDIL',
    capacity: 4000,
    currentLevel: 3200,
    nodes: createWallNodesForSilo('SILO_T3'),
  },
  {
    id: 'SILO_T4',
    name: 'Silo Terciario - Trigo',
    plantId: 'PLANT_TANDIL',
    capacity: 4000,
    currentLevel: 1000,
    nodes: createWallNodesForSilo('SILO_T4'),
  },
  {
    id: 'SILO_J1',
    name: 'Silo Principal - Trigo',
    plantId: 'PLANT_JUAREZ',
    capacity: 5000,
    currentLevel: 4000,
    nodes: createWallNodesForSilo('SILO_J1'),
  },
  {
    id: 'SILO_J2',
    name: 'Silo Secundario - Maíz',
    plantId: 'PLANT_JUAREZ',
    capacity: 2500,
    currentLevel: 2000,
    nodes: createWallNodesForSilo('SILO_J2'),
  },
];