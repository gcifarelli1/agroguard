import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { getNodeStatus, gaussianNoise } from '@/data/thresholds';
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
      const updatedSilos = currentSilos.map((silo) => {
        const updatedNodes = silo.nodes.map((node) => {
          const newMetrics = {
            temperature: Math.max(0, meanRevertingNoise(node.metrics.temperature, BASELINES.temperature, 0.08)),
            humidity: Math.max(0, meanRevertingNoise(node.metrics.humidity, BASELINES.humidity, 0.05)),
            acousticLevel: Math.max(0, meanRevertingNoise(node.metrics.acousticLevel, BASELINES.acousticLevel, 0.1)),
          };
          return {
            ...node,
            metrics: newMetrics,
            status: getNodeStatus(newMetrics.temperature, newMetrics.humidity, newMetrics.acousticLevel),
          };
        });
        return { ...silo, nodes: updatedNodes };
      });

      useStore.setState({ silos: updatedSilos });

      if (Math.random() < ANOMALY_PROBABILITY) {
        const randomSilo = updatedSilos[Math.floor(Math.random() * updatedSilos.length)];
        const randomNode = randomSilo.nodes[Math.floor(Math.random() * randomSilo.nodes.length)];
        const anomalyTypes = ['HEAT', 'HUMIDITY', 'BIO_ACOUSTIC'] as const;
        const anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];

        const intensityMultiplier = 2 + Math.random() * 2;
        if (anomalyType === 'HEAT') {
          randomNode.metrics.temperature = 25 + intensityMultiplier;
        } else if (anomalyType === 'HUMIDITY') {
          randomNode.metrics.humidity = 15 + intensityMultiplier / 2;
        } else {
          randomNode.metrics.acousticLevel = 18 + intensityMultiplier * 1.5;
        }
        randomNode.status = getNodeStatus(randomNode.metrics.temperature, randomNode.metrics.humidity, randomNode.metrics.acousticLevel);

        const newAlert: AlertEvent = {
          id: generateAlertId(),
          timestamp: new Date().toISOString(),
          type: anomalyType,
          severity: 'critical',
          location: randomNode.position,
          siloId: randomSilo.id,
          nodeId: randomNode.id,
          message: `Anomalía autónoma: ${anomalyType === 'HEAT' ? 'Calor excesivo' : anomalyType === 'HUMIDITY' ? 'Humedad crítica' : 'Actividad biológica'} detectada en ${randomNode.id}.`,
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