export type UserRole = 'PLANT_MANAGER' | 'GLOBAL_ADMIN';
export type SiloStatus = 'normal' | 'warning' | 'critical';
export type AlertSeverity = 'warning' | 'critical';
export type AlertType = 'HEAT' | 'HUMIDITY' | 'BIO_ACOUSTIC';
export type AnomalyIntensity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AlertStatus = 'active' | 'resolving' | 'resolved';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  plantId: string;
}

export interface Plant {
  id: string;
  name: string;
  location?: string;
  silos: string[];
}

export interface SensorNode {
  id: string;
  position: { x: number; y: number; z: number };
  metrics: {
    temperature: number;
    humidity: number;
    acousticLevel: number;
  };
  status: SiloStatus;
}

export interface Silo {
  id: string;
  name: string;
  plantId: string;
  capacity: number;
  currentLevel: number;
  nodes: SensorNode[];
  cerealType?: string;
  layerCount?: number;
}

export interface AlertEvent {
  id: string;
  timestamp: string;
  type: AlertType;
  severity: AlertSeverity;
  location: { x: number; y: number; z: number };
  siloId: string;
  nodeId: string;
  message: string;
  actionRequired: string;
  status: AlertStatus;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface InjectionParams {
  siloId: string;
  x: number;
  y: number;
  z: number;
  type: AlertType;
  intensity: AnomalyIntensity;
}

export interface Cereal {
  id: string;
  name: string;
  tempOptimal: number;
  tempWarning: number;
  humOptimal: number;
  humWarning: number;
}

export interface StoredNode {
  id: string;
  position: { x: number; y: number; z: number };
}

export type StoredSilo = Omit<Silo, 'nodes'> & { nodes?: StoredNode[] };