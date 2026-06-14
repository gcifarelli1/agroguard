import { create } from 'zustand';
import { User, Silo, AlertEvent, InjectionParams, SensorNode, Plant, Cereal } from '@/types';
import { mockSilos, mockPlants, mockUsers, mockCereals } from '@/data/mockData';
import { getNodeStatus, THRESHOLDS } from '@/data/thresholds';

interface AppState {
  currentUser: User | null;
  selectedPlantId: string;
  selectedSiloId: string | null;
  silos: Silo[];
  alerts: AlertEvent[];
  isSimulationRunning: boolean;
  selectedNode: SensorNode | null;
  cereals: Cereal[];

  setCurrentUser: (user: User) => void;
  logout: () => void;
  setSelectedPlantId: (plantId: string) => void;
  setSelectedSiloId: (siloId: string | null) => void;
  setSelectedNode: (node: SensorNode | null) => void;
  injectAnomaly: (params: InjectionParams) => void;
  applyMitigation: (alertId: string, action: string) => void;
  resetMVP: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;

  persistAlert: (alert: AlertEvent) => void;
  loadPersistedData: () => void;

  // CRUD Users
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;

  // CRUD Plants
  addPlant: (plant: Plant) => void;
  updatePlant: (plantId: string, updates: Partial<Plant>) => void;
  deletePlant: (plantId: string) => void;

  // CRUD Silos
  addSilo: (silo: Silo) => void;
  updateSilo: (siloId: string, updates: Partial<Silo>) => void;
  deleteSilo: (siloId: string) => void;
  addNodeToSilo: (siloId: string, layer: number) => void;
  removeNodeFromSilo: (siloId: string, nodeId: string) => void;

  // CRUD Cereales
  addCereal: (cereal: Cereal) => void;
  updateCereal: (cerealId: string, updates: Partial<Cereal>) => void;
  deleteCereal: (cerealId: string) => void;
}

const MAX_PERSISTED_ALERTS = 10;

function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

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

function silosWithNodes(silosData: Array<Omit<Silo, 'nodes'>>): Silo[] {
  return silosData.map((s) => ({
    ...s,
    nodes: createWallNodesForSilo(s.id, s.layerCount || 3),
  }));
}

function getDefaultSilos(): Silo[] {
  return silosWithNodes(mockSilos.map(({ nodes: _nodes, ...rest }) => rest));
}

function getDefaultPlants(): Plant[] {
  return mockPlants;
}

function getDefaultUsers(): User[] {
  return mockUsers;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  selectedPlantId: 'PLANT_JUAREZ',
  selectedSiloId: null,
  silos: getDefaultSilos(),
  alerts: [],
  isSimulationRunning: false,
  selectedNode: null,
  cereals: mockCereals,

  setCurrentUser: (user) => {
    const plantId = user.role === 'GLOBAL_ADMIN' ? 'PLANT_JUAREZ' : user.plantId;
    set({ currentUser: user, selectedPlantId: plantId });
    localStorage.setItem('agroguard_user', JSON.stringify(user));
  },

  logout: () => {
    set({ currentUser: null, selectedSiloId: null, selectedNode: null });
    localStorage.removeItem('agroguard_user');
  },

  setSelectedPlantId: (plantId) => set({ selectedPlantId: plantId, selectedSiloId: null }),
  setSelectedSiloId: (siloId) => set({ selectedSiloId: siloId, selectedNode: null }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  startSimulation: () => set({ isSimulationRunning: true }),
  stopSimulation: () => set({ isSimulationRunning: false }),

  injectAnomaly: (params) => {
    const { silos } = get();
    const targetSilo = silos.find((s) => s.id === params.siloId);
    if (!targetSilo) return;

    const nodeIndex = params.x;
    const node = targetSilo.nodes[nodeIndex];
    if (!node) return;

    const intensityMultiplier =
      params.intensity === 'LOW' ? 1.5 : params.intensity === 'MEDIUM' ? 2.5 : 4;

    if (params.type === 'HEAT') {
      node.metrics.temperature = THRESHOLDS.temperature.warning + 5 * intensityMultiplier;
    } else if (params.type === 'HUMIDITY') {
      node.metrics.humidity = THRESHOLDS.humidity.warning + 2 * intensityMultiplier;
    } else {
      node.metrics.acousticLevel = THRESHOLDS.acousticLevel.warning + 5 * intensityMultiplier;
    }

    node.status = getNodeStatus(node.metrics.temperature, node.metrics.humidity, node.metrics.acousticLevel);

    const newAlert: AlertEvent = {
      id: generateAlertId(),
      timestamp: new Date().toISOString(),
      type: params.type,
      severity: 'critical',
      location: params,
      siloId: params.siloId,
      nodeId: node.id,
      message: `${params.type === 'HEAT' ? 'Calor excesivo' : params.type === 'HUMIDITY' ? 'Humedad crítica' : 'Actividad biológica anormal'} detectada en nodo ${node.id}.`,
      actionRequired: params.type === 'BIO_ACOUSTIC' ? 'Aplicar Tratamiento' : 'Activar Ventilación',
      status: 'active',
    };

    set({ silos: [...silos] });
    get().persistAlert(newAlert);
  },

  applyMitigation: (alertId, _action) => {
    const { alerts, silos } = get();
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return;

    alert.status = 'resolving';
    const silo = silos.find((s) => s.id === alert.siloId);
    const node = silo?.nodes.find((n) => n.id === alert.nodeId);
    if (node) {
      const anomalyValue = alert.type === 'HEAT'
        ? node.metrics.temperature
        : alert.type === 'HUMIDITY'
          ? node.metrics.humidity
          : node.metrics.acousticLevel;

      const mitigateInterval = setInterval(() => {
        const currentSilo = get().silos.find((s) => s.id === alert.siloId);
        const currentNode = currentSilo?.nodes.find((n) => n.id === alert.nodeId);
        if (!currentNode) {
          clearInterval(mitigateInterval);
          return;
        }

        let resolved = false;
        if (alert.type === 'HEAT' || alert.type === 'HUMIDITY') {
          currentNode.metrics.temperature = Math.max(THRESHOLDS.temperature.optimal, currentNode.metrics.temperature - 1.5);
          currentNode.metrics.humidity = Math.max(THRESHOLDS.humidity.optimal, currentNode.metrics.humidity - 0.8);
          if (currentNode.metrics.temperature <= THRESHOLDS.temperature.optimal && currentNode.metrics.humidity <= THRESHOLDS.humidity.optimal) {
            resolved = true;
          }
        } else {
          currentNode.metrics.acousticLevel = Math.max(THRESHOLDS.acousticLevel.optimal, currentNode.metrics.acousticLevel - 2);
          if (currentNode.metrics.acousticLevel <= THRESHOLDS.acousticLevel.optimal) {
            resolved = true;
          }
        }

        currentNode.status = getNodeStatus(currentNode.metrics.temperature, currentNode.metrics.humidity, currentNode.metrics.acousticLevel);

        if (resolved) {
          currentNode.status = 'normal';
          const currentAlerts = get().alerts;
          const alertIndex = currentAlerts.findIndex((a) => a.id === alertId);
          if (alertIndex !== -1) {
            const resolvedAlert = currentAlerts[alertIndex];
            resolvedAlert.status = 'resolved';
            resolvedAlert.resolvedBy = get().currentUser?.name || 'Sistema';
            resolvedAlert.resolvedAt = new Date().toISOString();

            const reportData = {
              alertId: resolvedAlert.id,
              nodeId: resolvedAlert.nodeId,
              timestamp: resolvedAlert.timestamp,
              resolvedAt: resolvedAlert.resolvedAt,
              resolvedBy: resolvedAlert.resolvedBy,
              anomalyType: resolvedAlert.type,
              anomalyValue: parseFloat(anomalyValue.toFixed(1)),
              plantId: currentSilo?.plantId,
              plantName: getPlantName(mockPlants, currentSilo?.plantId || ''),
              siloId: resolvedAlert.siloId,
              siloName: currentSilo?.name,
            };

            const localReportsStr = localStorage.getItem('agroguard_reports');
            const localReports = localReportsStr ? JSON.parse(localReportsStr) : [];
            const updatedReports = [reportData, ...localReports];
            localStorage.setItem('agroguard_reports', JSON.stringify(updatedReports));

            fetch('/api/reports', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reportData),
            })
              .then((res) => {
                if (res.ok) {
                  console.log('Reporte generado localmente en la carpeta /reports');
                }
              })
              .catch(() => {});
          }
          clearInterval(mitigateInterval);
          set({ alerts: [...currentAlerts] });
          localStorage.setItem('agroguard_alerts', JSON.stringify(currentAlerts));
        }

        set({ silos: [...get().silos] });
      }, 500);
    }

    set({ alerts: [...alerts] });
  },

  resetMVP: () => {
    localStorage.removeItem('agroguard_user');
    localStorage.removeItem('agroguard_alerts');
    localStorage.removeItem('agroguard_reports');
    localStorage.removeItem('agroguard_users');
    localStorage.removeItem('agroguard_plants');
    localStorage.removeItem('agroguard_silos');
    localStorage.removeItem('agroguard_cereals');
    set({
      currentUser: null,
      selectedPlantId: 'PLANT_JUAREZ',
      selectedSiloId: null,
      silos: getDefaultSilos(),
      alerts: [],
      selectedNode: null,
      cereals: mockCereals,
    });
  },

  persistAlert: (alert) => {
    const { alerts } = get();
    const updatedAlerts = [alert, ...alerts].slice(0, MAX_PERSISTED_ALERTS);
    set({ alerts: updatedAlerts });
    localStorage.setItem('agroguard_alerts', JSON.stringify(updatedAlerts));
  },

  loadPersistedData: () => {
    const userStr = localStorage.getItem('agroguard_user');
    const alertsStr = localStorage.getItem('agroguard_alerts');

    const silosStr = localStorage.getItem('agroguard_silos');
    const plantsStr = localStorage.getItem('agroguard_plants');
    const usersStr = localStorage.getItem('agroguard_users');

    if (userStr) {
      const user = JSON.parse(userStr) as User;
      const plantId = user.role === 'GLOBAL_ADMIN' ? 'PLANT_JUAREZ' : user.plantId;
      set({ currentUser: user, selectedPlantId: plantId });
    }

    if (alertsStr) {
      const alerts = JSON.parse(alertsStr) as AlertEvent[];
      set({ alerts });
    }

    if (silosStr) {
      const silosData = JSON.parse(silosStr) as Array<Omit<Silo, 'nodes'>>;
      set({ silos: silosWithNodes(silosData) });
    } else {
      const defaultSilos = getDefaultSilos();
      const silosForStorage = defaultSilos.map(({ nodes: _nodes, ...rest }) => rest);
      localStorage.setItem('agroguard_silos', JSON.stringify(silosForStorage));
    }

    if (plantsStr) {
      // plants disponibles en localStorage
    } else {
      localStorage.setItem('agroguard_plants', JSON.stringify(getDefaultPlants()));
    }

    if (usersStr) {
      // users disponibles en localStorage
    } else {
      localStorage.setItem('agroguard_users', JSON.stringify(getDefaultUsers()));
    }

    const cerealsStr = localStorage.getItem('agroguard_cereals');
    if (cerealsStr) {
      const cereals = JSON.parse(cerealsStr) as Cereal[];
      set({ cereals });
    } else {
      localStorage.setItem('agroguard_cereals', JSON.stringify(mockCereals));
    }
  },

  // CRUD Users
  addUser: (user) => {
    const usersStr = localStorage.getItem('agroguard_users');
    const users = usersStr ? JSON.parse(usersStr) : getDefaultUsers();
    const updated = [...users, user];
    localStorage.setItem('agroguard_users', JSON.stringify(updated));
  },

  updateUser: (userId, updates) => {
    const usersStr = localStorage.getItem('agroguard_users');
    const users = usersStr ? JSON.parse(usersStr) : getDefaultUsers();
    const updated = users.map((u: User) => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem('agroguard_users', JSON.stringify(updated));
  },

  deleteUser: (userId) => {
    const usersStr = localStorage.getItem('agroguard_users');
    const users = usersStr ? JSON.parse(usersStr) : getDefaultUsers();
    const updated = users.filter((u: User) => u.id !== userId);
    localStorage.setItem('agroguard_users', JSON.stringify(updated));
  },

  // CRUD Plants
  addPlant: (plant) => {
    const plantsStr = localStorage.getItem('agroguard_plants');
    const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
    const updated = [...plants, { ...plant }];
    localStorage.setItem('agroguard_plants', JSON.stringify(updated));
  },

  updatePlant: (plantId, updates) => {
    const plantsStr = localStorage.getItem('agroguard_plants');
    const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
    const updated = plants.map((p: Plant) => p.id === plantId ? { ...p, ...updates } : p);
    localStorage.setItem('agroguard_plants', JSON.stringify(updated));
  },

  deletePlant: (plantId) => {
    const plantsStr = localStorage.getItem('agroguard_plants');
    const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
    const updated = plants.filter((p: Plant) => p.id !== plantId);
    localStorage.setItem('agroguard_plants', JSON.stringify(updated));

    const silosStr = localStorage.getItem('agroguard_silos');
    const silosData = silosStr ? JSON.parse(silosStr) : getDefaultSilos().map(({ nodes: _nodes, ...rest }) => rest);
    const filteredSilos = silosData.filter((s: Silo) => s.plantId !== plantId);
    localStorage.setItem('agroguard_silos', JSON.stringify(filteredSilos));
    set({ silos: silosWithNodes(filteredSilos) });
  },

  // CRUD Silos
  addSilo: (silo) => {
    const silosStr = localStorage.getItem('agroguard_silos');
    const silosData = silosStr ? JSON.parse(silosStr) : getDefaultSilos().map(({ nodes: _nodes, ...rest }) => rest);
    const layerCount = silo.layerCount || 3;
    const newSilo = {
      ...silo,
      layerCount,
      nodes: createWallNodesForSilo(silo.id, layerCount),
    };
    const updated = [...silosData, { ...silo }];
    localStorage.setItem('agroguard_silos', JSON.stringify(updated));
    set({ silos: [...get().silos, newSilo] });

    const plantsStr = localStorage.getItem('agroguard_plants');
    const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
    const updatedPlants = plants.map((p: Plant) =>
      p.id === silo.plantId ? { ...p, silos: [...p.silos, silo.id] } : p
    );
    localStorage.setItem('agroguard_plants', JSON.stringify(updatedPlants));
  },

  updateSilo: (siloId, updates) => {
    const silosStr = localStorage.getItem('agroguard_silos');
    const silosData = silosStr ? JSON.parse(silosStr) : getDefaultSilos().map(({ nodes: _nodes, ...rest }) => rest);
    const updated = silosData.map((s: Silo) => s.id === siloId ? { ...s, ...updates } : s);
    localStorage.setItem('agroguard_silos', JSON.stringify(updated));

    const currentSilos = get().silos;
    const updatedWithNodes = currentSilos.map((s) =>
      s.id === siloId ? { ...s, ...updates } : s
    );
    set({ silos: updatedWithNodes });
  },

  deleteSilo: (siloId) => {
    const silosStr = localStorage.getItem('agroguard_silos');
    const silosData = silosStr ? JSON.parse(silosStr) : getDefaultSilos().map(({ nodes: _nodes, ...rest }) => rest);
    const deletedSilo = silosData.find((s: Silo) => s.id === siloId);
    const updated = silosData.filter((s: Silo) => s.id !== siloId);
    localStorage.setItem('agroguard_silos', JSON.stringify(updated));

    const currentSilos = get().silos;
    set({ silos: currentSilos.filter((s) => s.id !== siloId) });

    if (deletedSilo) {
      const plantsStr = localStorage.getItem('agroguard_plants');
      const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
      const updatedPlants = plants.map((p: Plant) =>
        p.id === deletedSilo.plantId
          ? { ...p, silos: p.silos.filter((id: string) => id !== siloId) }
          : p
      );
      localStorage.setItem('agroguard_plants', JSON.stringify(updatedPlants));
    }
  },

  addNodeToSilo: (siloId, layer) => {
    const silos = get().silos;
    const silo = silos.find((s) => s.id === siloId);
    if (!silo) return;

    const siloH = 5.2;
    const layerCount = silo.layerCount || 3;
    const nodesInLayer = silo.nodes.filter((n) => {
      const normalizedY = (n.position.y + siloH / 2) / siloH;
      const nodeLayer = normalizedY < 1 / layerCount ? 0
        : normalizedY < 2 / layerCount ? 1
        : layer - 1;
      return nodeLayer === layer;
    });

    const newNodeIndex = nodesInLayer.length + 1;
    const siloR = 1.6;
    const margin = 0.15;
    const radius = siloR - margin;
    const layerHeight = siloH / (layerCount + 1);
    const y = -siloH / 2 + layerHeight * (layer + 1);
    const angle = (newNodeIndex / (nodesInLayer.length + 1)) * Math.PI * 2;

    const newNode: SensorNode = {
      id: `${siloId}-node-${silo.nodes.length + 1}`,
      position: { x: radius * Math.cos(angle), y, z: radius * Math.sin(angle) },
      metrics: {
        temperature: 15 + Math.random() * 2,
        humidity: 11 + Math.random() * 1.5,
        acousticLevel: 8 + Math.random() * 2,
      },
      status: 'normal',
    };

    const updatedSilos = silos.map((s) =>
      s.id === siloId ? { ...s, nodes: [...s.nodes, newNode] } : s
    );
    set({ silos: updatedSilos });

    const silosStr = localStorage.getItem('agroguard_silos');
    const silosData = silosStr ? JSON.parse(silosStr) : getDefaultSilos().map(({ nodes: _nodes, ...rest }) => rest);
    const updatedData = silosData.map((s: Silo) =>
      s.id === siloId ? { ...s, nodes: [...s.nodes, newNode] } : s
    );
    localStorage.setItem('agroguard_silos', JSON.stringify(updatedData));
  },

  removeNodeFromSilo: (siloId, nodeId) => {
    const silos = get().silos;
    const updatedSilos = silos.map((s) =>
      s.id === siloId ? { ...s, nodes: s.nodes.filter((n) => n.id !== nodeId) } : s
    );
    set({ silos: updatedSilos });

    const silosStr = localStorage.getItem('agroguard_silos');
    const silosData = silosStr ? JSON.parse(silosStr) : getDefaultSilos().map(({ nodes: _nodes, ...rest }) => rest);
    const updatedData = silosData.map((s: Silo) =>
      s.id === siloId ? { ...s, nodes: s.nodes.filter((n: SensorNode) => n.id !== nodeId) } : s
    );
    localStorage.setItem('agroguard_silos', JSON.stringify(updatedData));
  },

  // CRUD Cereales
  addCereal: (cereal) => {
    const cereals = get().cereals;
    const updated = [...cereals, cereal];
    set({ cereals: updated });
    localStorage.setItem('agroguard_cereals', JSON.stringify(updated));
  },

  updateCereal: (cerealId, updates) => {
    const cereals = get().cereals;
    const updated = cereals.map((c) => c.id === cerealId ? { ...c, ...updates } : c);
    set({ cereals: updated });
    localStorage.setItem('agroguard_cereals', JSON.stringify(updated));
  },

  deleteCereal: (cerealId) => {
    const cereals = get().cereals;
    const updated = cereals.filter((c) => c.id !== cerealId);
    set({ cereals: updated });
    localStorage.setItem('agroguard_cereals', JSON.stringify(updated));
  },
}));

export function getSilosForPlant(silos: Silo[], plantId: string): Silo[] {
  if (plantId === 'ALL') return silos;
  return silos.filter((s) => s.plantId === plantId);
}

export function getPlantName(plants: Plant[], plantId: string): string {
  if (plantId === 'ALL') return 'Todas las Plantas';
  return plants.find((p) => p.id === plantId)?.name || 'Desconocida';
}

export { mockPlants };