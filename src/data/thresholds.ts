import { Cereal, SiloStatus } from '@/types';

export const THRESHOLDS = {
  temperature: {
    optimal: 17.0,
    warning: 24.0,
  },
  humidity: {
    optimal: 13.0,
    warning: 15.0,
  },
  acousticLevel: {
    optimal: 12.0,
    warning: 20.0,
  },
};

export function getNodeStatus(
  temperature: number,
  humidity: number,
  acousticLevel: number,
  cereal?: Cereal
): SiloStatus {
  const tempOptimal = cereal?.tempOptimal ?? THRESHOLDS.temperature.optimal;
  const tempWarning = cereal?.tempWarning ?? THRESHOLDS.temperature.warning;
  const humOptimal  = cereal?.humOptimal  ?? THRESHOLDS.humidity.optimal;
  const humWarning  = cereal?.humWarning  ?? THRESHOLDS.humidity.warning;

  if (
    temperature > tempWarning ||
    humidity > humWarning ||
    acousticLevel > THRESHOLDS.acousticLevel.warning
  ) {
    return 'critical';
  }
  if (
    temperature > tempOptimal ||
    humidity > humOptimal ||
    acousticLevel > THRESHOLDS.acousticLevel.optimal
  ) {
    return 'warning';
  }
  return 'normal';
}

export function gaussianNoise(stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}