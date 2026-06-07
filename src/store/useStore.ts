import { create } from 'zustand';
import { User, Silo, AlertEvent, InjectionParams, SensorNode, Plant } from '@/types';
import { mockSilos } from '@/data/mockData';
import { getNodeStatus, THRESHOLDS } from '@/data/thresholds';

interface AppState {
  currentUser: User | null;
  selectedPlantId: string;
  selectedSiloId: string | null;
  silos: Silo[];
  alerts: AlertEvent[];
  isSimulationRunning: boolean;
  selectedNode: SensorNode | null;

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
}

const MAX_PERSISTED_ALERTS = 10;

function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  selectedPlantId: 'PLANT_JUAREZ',
  selectedSiloId: null,
  silos: mockSilos,
  alerts: [],
  isSimulationRunning: false,
  selectedNode: null,

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
            currentAlerts[alertIndex].status = 'resolved';
            currentAlerts[alertIndex].resolvedBy = get().currentUser?.name;
            currentAlerts[alertIndex].resolvedAt = new Date().toISOString();
          }
          clearInterval(mitigateInterval);
        }

        set({ silos: [...get().silos] });
      }, 500);
    }

    set({ alerts: [...alerts] });
  },

  resetMVP: () => {
    localStorage.removeItem('agroguard_user');
    localStorage.removeItem('agroguard_alerts');
    set({
      currentUser: null,
      selectedPlantId: 'PLANT_JUAREZ',
      selectedSiloId: null,
      silos: mockSilos,
      alerts: [],
      selectedNode: null,
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

    if (userStr) {
      const user = JSON.parse(userStr) as User;
      const plantId = user.role === 'GLOBAL_ADMIN' ? 'PLANT_JUAREZ' : user.plantId;
      set({ currentUser: user, selectedPlantId: plantId });
    }

    if (alertsStr) {
      const alerts = JSON.parse(alertsStr) as AlertEvent[];
      set({ alerts });
    }
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