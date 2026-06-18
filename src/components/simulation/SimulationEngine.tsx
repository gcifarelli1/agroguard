import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { getNodeStatus, gaussianNoise, THRESHOLDS } from '@/data/thresholds';
import { AlertEvent } from '@/types';

const SIMULATION_INTERVAL = 3000;
const ANOMALY_PROBABILITY = 0.01;

// Baseline values around which metrics naturally fluctuate (mean-reverting center)
const BASELINES = {
  temperature: 15.5,  // midpoint of 15-17 range, well below optimal=17
  humidity: 11.5,     // midpoint of 11-12.5 range, well below optimal=13
  acousticLevel: 8.5,  // midpoint of 8-10 range, well below optimal=12
};

// Mean-reversion factor (0.05 = 5% pull back toward baseline each tick)
// Makes the simulation physically realistic (thermal inertia of grain mass)
const REVERSION_FACTOR = 0.05;

function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function meanRevertingNoise(current: number, baseline: number, noiseStdDev: number): number {
  return current + (baseline - current) * REVERSION_FACTOR + gaussianNoise(noiseStdDev);
}

export default function SimulationEngine() {
  const { isSimulationRunning, startSimulation, persistAlert } = useStore();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isSimulationRunning) {
      startSimulation();
    }
  }, [isSimulationRunning, startSimulation]);

  useEffect(() => {
    if (!isSimulationRunning) return;

    intervalRef.current = window.setInterval(() => {
      const state = useStore.getState();
      const currentSilos = state.silos;
      const cereals = state.cereals;
      const updatedSilos = currentSilos.map((silo) => {
        const cereal = cereals.find((c) => c.id === silo.cerealType);
        const updatedNodes = silo.nodes.map((node) => {
          const newMetrics = {
            temperature: Math.max(0, meanRevertingNoise(node.metrics.temperature, BASELINES.temperature, 0.08)),
            humidity: Math.max(0, meanRevertingNoise(node.metrics.humidity, BASELINES.humidity, 0.05)),
            acousticLevel: Math.max(0, meanRevertingNoise(node.metrics.acousticLevel, BASELINES.acousticLevel, 0.1)),
          };
          return {
            ...node,
            metrics: newMetrics,
            status: getNodeStatus(newMetrics.temperature, newMetrics.humidity, newMetrics.acousticLevel, cereal),
          };
        });
        return { ...silo, nodes: updatedNodes };
      });

      useStore.setState({ silos: updatedSilos });

      if (Math.random() < ANOMALY_PROBABILITY) {
        const randomSiloIndex = Math.floor(Math.random() * updatedSilos.length);
        const randomSilo = updatedSilos[randomSiloIndex];
        if (!randomSilo.nodes.length) return;
        const randomNodeIndex = Math.floor(Math.random() * randomSilo.nodes.length);
        const randomNode = randomSilo.nodes[randomNodeIndex];
        const anomalyTypes = ['HEAT', 'HUMIDITY', 'BIO_ACOUSTIC'] as const;
        const anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
        const intensityMultiplier = 2 + Math.random() * 2;
        const cereal = cereals.find((c) => c.id === randomSilo.cerealType);

        const anomalyMetrics = {
          temperature: anomalyType === 'HEAT'
            ? (cereal?.tempWarning ?? THRESHOLDS.temperature.warning) + intensityMultiplier
            : randomNode.metrics.temperature,
          humidity: anomalyType === 'HUMIDITY'
            ? (cereal?.humWarning ?? THRESHOLDS.humidity.warning) + intensityMultiplier / 2
            : randomNode.metrics.humidity,
          acousticLevel: anomalyType === 'BIO_ACOUSTIC' ? THRESHOLDS.acousticLevel.warning + intensityMultiplier * 1.5 : randomNode.metrics.acousticLevel,
        };
        const anomalyNode = {
          ...randomNode,
          metrics: anomalyMetrics,
          status: getNodeStatus(anomalyMetrics.temperature, anomalyMetrics.humidity, anomalyMetrics.acousticLevel, cereal),
        };
        const anomalyUpdatedSilos = updatedSilos.map((s, si) =>
          si !== randomSiloIndex
            ? s
            : { ...s, nodes: s.nodes.map((n, ni) => (ni === randomNodeIndex ? anomalyNode : n)) }
        );

        useStore.setState({ silos: anomalyUpdatedSilos });

        const newAlert: AlertEvent = {
          id: generateAlertId(),
          timestamp: new Date().toISOString(),
          type: anomalyType,
          severity: 'critical',
          location: anomalyNode.position,
          siloId: randomSilo.id,
          nodeId: anomalyNode.id,
          message: `Anomalía autónoma: ${anomalyType === 'HEAT' ? 'Calor excesivo' : anomalyType === 'HUMIDITY' ? 'Humedad crítica' : 'Actividad biológica'} detectada en ${anomalyNode.id}.`,
          actionRequired: anomalyType === 'BIO_ACOUSTIC' ? 'Aplicar Tratamiento' : 'Activar Ventilación',
          status: 'active',
        };
        persistAlert(newAlert);
      }
    }, SIMULATION_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSimulationRunning, persistAlert]);

  return null;
}