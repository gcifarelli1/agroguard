import { create } from 'zustand';
import { User, Silo, AlertEvent, InjectionParams, SensorNode, Plant, Cereal, StoredSilo } from '@/types';
import { mockSilos, mockPlants, mockUsers, mockCereals } from '@/data/mockData';
import { getNodeStatus, THRESHOLDS } from '@/data/thresholds';
import {
  createWallNodesForSilo,
  toStoredNode,
  hydrateStoredNode,
  getLayerForY,
  freshBaselineMetrics,
  MAX_NODES_PER_LAYER,
  SILO_R,
  SILO_H,
  MARGIN,
} from '@/utils/nodeGeometry';

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
  regenerateSiloNodes: (siloId: string, layerCount: number) => void;

  // CRUD Cereales
  addCereal: (cereal: Cereal) => void;
  updateCereal: (cerealId: string, updates: Partial<Cereal>) => void;
  deleteCereal: (cerealId: string) => void;
}

const MAX_PERSISTED_ALERTS = 10;

function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function getDefaultSilos(): Silo[] {
  return mockSilos.map((s) => ({
    ...s,
    nodes: createWallNodesForSilo(s.id, s.layerCount || 3),
  }));
}

function getDefaultPlants(): Plant[] {
  return mockPlants;
}

function getDefaultUsers(): User[] {
  return mockUsers;
}

// Fire-and-forget: persists CRUD data to the seed JSON files via the Vite dev-server middleware.
// Fails silently in production builds where the endpoint does not exist.
function syncToFile(entity: string, data: unknown[]): void {
  fetch(`/api/sync/${entity}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}

/** Serialises runtime silos (with full SensorNode[]) to StoredSilo[] and persists them. */
function persistSilosFromRuntime(runtimeSilos: Silo[]): void {
  const stored: StoredSilo[] = runtimeSilos.map((s) => ({
    ...s,
    nodes: s.nodes.map(toStoredNode),
  }));
  localStorage.setItem('agroguard_silos', JSON.stringify(stored));
  syncToFile('silos', stored);
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

    const newMetrics = {
      temperature: params.type === 'HEAT'
        ? THRESHOLDS.temperature.warning + 5 * intensityMultiplier
        : node.metrics.temperature,
      humidity: params.type === 'HUMIDITY'
        ? THRESHOLDS.humidity.warning + 2 * intensityMultiplier
        : node.metrics.humidity,
      acousticLevel: params.type === 'BIO_ACOUSTIC'
        ? THRESHOLDS.acousticLevel.warning + 5 * intensityMultiplier
        : node.metrics.acousticLevel,
    };

    const updatedNode = {
      ...node,
      metrics: newMetrics,
      status: getNodeStatus(newMetrics.temperature, newMetrics.humidity, newMetrics.acousticLevel),
    };

    const updatedSilos = silos.map((s) =>
      s.id !== params.siloId
        ? s
        : { ...s, nodes: s.nodes.map((n, i) => (i === nodeIndex ? updatedNode : n)) }
    );

    const newAlert: AlertEvent = {
      id: generateAlertId(),
      timestamp: new Date().toISOString(),
      type: params.type,
      severity: 'critical',
      location: params,
      siloId: params.siloId,
      nodeId: updatedNode.id,
      message: `${params.type === 'HEAT' ? 'Calor excesivo' : params.type === 'HUMIDITY' ? 'Humedad crítica' : 'Actividad biológica anormal'} detectada en nodo ${updatedNode.id}.`,
      actionRequired: params.type === 'BIO_ACOUSTIC' ? 'Aplicar Tratamiento' : 'Activar Ventilación',
      status: 'active',
    };

    set({ silos: updatedSilos });
    get().persistAlert(newAlert);
  },

  applyMitigation: (alertId, _action) => {
    const { alerts, silos } = get();
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return;

    const silo = silos.find((s) => s.id === alert.siloId);
    const node = silo?.nodes.find((n) => n.id === alert.nodeId);

    set({ alerts: alerts.map((a) => a.id === alertId ? { ...a, status: 'resolving' as const } : a) });

    if (node) {
      const anomalyValue = alert.type === 'HEAT'
        ? node.metrics.temperature
        : alert.type === 'HUMIDITY'
          ? node.metrics.humidity
          : node.metrics.acousticLevel;

      const mitigateInterval = setInterval(() => {
        const currentSilos = get().silos;
        const currentSilo = currentSilos.find((s) => s.id === alert.siloId);
        const currentNode = currentSilo?.nodes.find((n) => n.id === alert.nodeId);
        if (!currentNode) {
          clearInterval(mitigateInterval);
          return;
        }

        let resolved = false;
        let newMetrics = { ...currentNode.metrics };

        if (alert.type === 'HEAT' || alert.type === 'HUMIDITY') {
          newMetrics = {
            ...newMetrics,
            temperature: Math.max(THRESHOLDS.temperature.optimal, newMetrics.temperature - 1.5),
            humidity: Math.max(THRESHOLDS.humidity.optimal, newMetrics.humidity - 0.8),
          };
          if (newMetrics.temperature <= THRESHOLDS.temperature.optimal && newMetrics.humidity <= THRESHOLDS.humidity.optimal) {
            resolved = true;
          }
        } else {
          newMetrics = {
            ...newMetrics,
            acousticLevel: Math.max(THRESHOLDS.acousticLevel.optimal, newMetrics.acousticLevel - 2),
          };
          if (newMetrics.acousticLevel <= THRESHOLDS.acousticLevel.optimal) {
            resolved = true;
          }
        }

        const newStatus = resolved
          ? 'normal' as const
          : getNodeStatus(newMetrics.temperature, newMetrics.humidity, newMetrics.acousticLevel);

        const updatedNode = { ...currentNode, metrics: newMetrics, status: newStatus };
        const newSilos = currentSilos.map((s) =>
          s.id !== alert.siloId
            ? s
            : { ...s, nodes: s.nodes.map((n) => (n.id === alert.nodeId ? updatedNode : n)) }
        );

        if (resolved) {
          const currentAlerts = get().alerts;
          const alertIndex = currentAlerts.findIndex((a) => a.id === alertId);
          if (alertIndex !== -1) {
            const resolvedAt = new Date().toISOString();
            const resolvedBy = get().currentUser?.name || 'Sistema';
            const originalAlert = currentAlerts[alertIndex];
            const newAlerts = currentAlerts.map((a) =>
              a.id !== alertId ? a : { ...a, status: 'resolved' as const, resolvedBy, resolvedAt }
            );

            const reportData = {
              alertId: originalAlert.id,
              nodeId: originalAlert.nodeId,
              timestamp: originalAlert.timestamp,
              resolvedAt,
              resolvedBy,
              anomalyType: originalAlert.type,
              anomalyValue: parseFloat(anomalyValue.toFixed(1)),
              plantId: currentSilo?.plantId,
              plantName: getPlantName(mockPlants, currentSilo?.plantId || ''),
              siloId: originalAlert.siloId,
              siloName: currentSilo?.name,
            };

            const localReportsStr = localStorage.getItem('agroguard_reports');
            const localReports = localReportsStr ? JSON.parse(localReportsStr) : [];
            localStorage.setItem('agroguard_reports', JSON.stringify([reportData, ...localReports]));

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

            clearInterval(mitigateInterval);
            set({ silos: newSilos, alerts: newAlerts });
            localStorage.setItem('agroguard_alerts', JSON.stringify(newAlerts));
          }
        } else {
          set({ silos: newSilos });
        }
      }, 500);
    }
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
      try {
        const storedSilos = JSON.parse(silosStr) as StoredSilo[];
        const hydratedSilos: Silo[] = storedSilos.map((s) => ({
          ...s,
          nodes: Array.isArray(s.nodes)
            ? s.nodes.map((n) => hydrateStoredNode(s.id, n))
            : createWallNodesForSilo(s.id, s.layerCount),
        }));
        set({ silos: hydratedSilos });
      } catch {
        set({ silos: getDefaultSilos() });
      }
    } else {
      const defaultSilos = getDefaultSilos();
      persistSilosFromRuntime(defaultSilos);
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
    syncToFile('users', updated);
  },

  updateUser: (userId, updates) => {
    const usersStr = localStorage.getItem('agroguard_users');
    const users = usersStr ? JSON.parse(usersStr) : getDefaultUsers();
    const updated = users.map((u: User) => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem('agroguard_users', JSON.stringify(updated));
    syncToFile('users', updated);
  },

  deleteUser: (userId) => {
    const usersStr = localStorage.getItem('agroguard_users');
    const users = usersStr ? JSON.parse(usersStr) : getDefaultUsers();
    const updated = users.filter((u: User) => u.id !== userId);
    localStorage.setItem('agroguard_users', JSON.stringify(updated));
    syncToFile('users', updated);
  },

  // CRUD Plants
  addPlant: (plant) => {
    const plantsStr = localStorage.getItem('agroguard_plants');
    const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
    const updated = [...plants, { ...plant }];
    localStorage.setItem('agroguard_plants', JSON.stringify(updated));
    syncToFile('plants', updated);
  },

  updatePlant: (plantId, updates) => {
    const plantsStr = localStorage.getItem('agroguard_plants');
    const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
    const updated = plants.map((p: Plant) => p.id === plantId ? { ...p, ...updates } : p);
    localStorage.setItem('agroguard_plants', JSON.stringify(updated));
    syncToFile('plants', updated);
  },

  deletePlant: (plantId) => {
    const plantsStr = localStorage.getItem('agroguard_plants');
    const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
    const updated = plants.filter((p: Plant) => p.id !== plantId);
    localStorage.setItem('agroguard_plants', JSON.stringify(updated));

    const currentSilos = get().silos;
    const filteredSilos = currentSilos.filter((s) => s.plantId !== plantId);
    set({ silos: filteredSilos });
    persistSilosFromRuntime(filteredSilos);
    syncToFile('plants', updated);
  },

  // CRUD Silos
  addSilo: (silo) => {
    const layerCount = silo.layerCount || 3;
    const newSilo: Silo = {
      ...silo,
      layerCount,
      nodes: createWallNodesForSilo(silo.id, layerCount),
    };
    const updatedSilos = [...get().silos, newSilo];
    set({ silos: updatedSilos });
    persistSilosFromRuntime(updatedSilos);

    const plantsStr = localStorage.getItem('agroguard_plants');
    const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
    const updatedPlants = plants.map((p: Plant) =>
      p.id === silo.plantId ? { ...p, silos: [...p.silos, silo.id] } : p
    );
    localStorage.setItem('agroguard_plants', JSON.stringify(updatedPlants));
    syncToFile('plants', updatedPlants);
  },

  updateSilo: (siloId, updates) => {
    const currentSilos = get().silos;
    const updatedSilos = currentSilos.map((s) =>
      s.id === siloId ? { ...s, ...updates } : s
    );
    set({ silos: updatedSilos });
    persistSilosFromRuntime(updatedSilos);
  },

  deleteSilo: (siloId) => {
    const currentSilos = get().silos;
    const deletedSilo = currentSilos.find((s) => s.id === siloId);
    const updatedSilos = currentSilos.filter((s) => s.id !== siloId);
    set({ silos: updatedSilos });
    persistSilosFromRuntime(updatedSilos);

    if (deletedSilo) {
      const plantsStr = localStorage.getItem('agroguard_plants');
      const plants = plantsStr ? JSON.parse(plantsStr) : getDefaultPlants();
      const updatedPlants = plants.map((p: Plant) =>
        p.id === deletedSilo.plantId
          ? { ...p, silos: p.silos.filter((id: string) => id !== siloId) }
          : p
      );
      localStorage.setItem('agroguard_plants', JSON.stringify(updatedPlants));
      syncToFile('plants', updatedPlants);
    }
  },

  addNodeToSilo: (siloId, layer) => {
    const silos = get().silos;
    const silo = silos.find((s) => s.id === siloId);
    if (!silo) return;

    const layerCount = silo.layerCount || 3;

    // Determine which layer to target based on the passed layer index.
    // We use getLayerForY to verify existing nodes, but the caller already
    // supplies the target layer directly.
    const targetLayer = Math.max(0, Math.min(layerCount - 1, layer));
    const nodesInLayer = silo.nodes.filter(
      (n) => getLayerForY(n.position.y, layerCount) === targetLayer
    );

    if (nodesInLayer.length >= MAX_NODES_PER_LAYER) return;

    // Collision-safe ID: parse numeric suffix from existing ids, take max+1.
    const existingNums = silo.nodes
      .map((n) => {
        const match = n.id.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;

    const radius = SILO_R - MARGIN;
    const layerHeight = SILO_H / (layerCount + 1);
    const y = -SILO_H / 2 + layerHeight * (targetLayer + 1);
    // Place the new node evenly in the 4-slot angular grid.
    const angle = (nodesInLayer.length / MAX_NODES_PER_LAYER) * Math.PI * 2;

    const newNode: SensorNode = {
      id: `${siloId}-node-${nextNum}`,
      position: { x: radius * Math.cos(angle), y, z: radius * Math.sin(angle) },
      metrics: freshBaselineMetrics(),
      status: 'normal',
    };

    const updatedSilos = silos.map((s) =>
      s.id === siloId ? { ...s, nodes: [...s.nodes, newNode] } : s
    );
    set({ silos: updatedSilos });
    persistSilosFromRuntime(updatedSilos);
  },

  removeNodeFromSilo: (siloId, nodeId) => {
    const silos = get().silos;
    const updatedSilos = silos.map((s) =>
      s.id === siloId ? { ...s, nodes: s.nodes.filter((n) => n.id !== nodeId) } : s
    );
    set({ silos: updatedSilos });
    persistSilosFromRuntime(updatedSilos);
  },

  regenerateSiloNodes: (siloId, layerCount) => {
    const { silos } = get();
    const updatedSilos = silos.map((s) =>
      s.id === siloId
        ? { ...s, layerCount, nodes: createWallNodesForSilo(siloId, layerCount) }
        : s
    );
    set({ silos: updatedSilos });
    persistSilosFromRuntime(updatedSilos);
  },

  // CRUD Cereales
  addCereal: (cereal) => {
    const cereals = get().cereals;
    const updated = [...cereals, cereal];
    set({ cereals: updated });
    localStorage.setItem('agroguard_cereals', JSON.stringify(updated));
    syncToFile('cereales', updated);
  },

  updateCereal: (cerealId, updates) => {
    const cereals = get().cereals;
    const updated = cereals.map((c) => c.id === cerealId ? { ...c, ...updates } : c);
    set({ cereals: updated });
    localStorage.setItem('agroguard_cereals', JSON.stringify(updated));
    syncToFile('cereales', updated);
  },

  deleteCereal: (cerealId) => {
    const cereals = get().cereals;
    const updated = cereals.filter((c) => c.id !== cerealId);
    set({ cereals: updated });
    localStorage.setItem('agroguard_cereals', JSON.stringify(updated));
    syncToFile('cereales', updated);
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