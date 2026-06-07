# Especificación Técnica - MVP AgroGuard (AgroTwin Web App)

## Introdución
AgroGuard es una empresa AgTech, cuyo objetivo principal es prevenir y mitigar los daños que pueden ocurrir en el almacenamiento de materia prima agropecuaria.

## 1. Objetivo del Proyecto
Crear un MVP interactivo (Single Page Application) para el ecosistema "AgroGuard". El sistema visualizará un Gemelo Digital 3D de silos de acopio. 
**Nuevos Requerimientos Críticos:**
1.  **RBAC (Role-Based Access Control) Simulado:** Un login mockeado donde el usuario elige su rol (ej. "Gerente Benito Juárez"). El sistema debe filtrar los datos para que solo vea los silos de su planta.
2.  **Simulación Dual:** El motor de sensores debe tener un `setInterval` de fondo que genere fluctuaciones aleatorias realistas (ruido) y anomalías esporádicas, además de permitir la inyección manual de crisis por parte del usuario (para demostraciones).


## 2. Arquitectura del Sistema (Vista de Componentes)
El MVP se divide en cuatro módulos lógicos:
1.  **Auth & Routing Context:** Mantiene el usuario activo y la planta que tiene asignada. Restringe el acceso a la vista del dashboard.
2.  **Simulation Engine (Mock Backend):** Un contexto que corre un `useEffect` con un `setInterval` (ej. cada 3 segundos). 
    * *Comportamiento Autónomo:* Añade ruido gaussiano pequeño a las métricas (ej. +/- 0.2 °C) y tiene un 2% de probabilidad por ciclo de generar un foco de calor o plaga al azar.
    * *Comportamiento Manual:* Expone la función `injectAnomaly(siloId, x, y, z, type, intensity)`.
3.  **AgroTwin 3D View:** El renderizador. Muestra la masa de grano del silo seleccionado, actualizando el color de los nodos según su estado térmico/acústico.
4.  **Operator Dashboard:** La interfaz de control. Muestra métricas filtradas por la planta activa del usuario.


## 3. Estructura de Datos (Mock Data Models)

### User & Plant
```json
{
  "currentUser": {
    "id": "u-02",
    "name": "Gerente Benito Juárez",
    "role": "PLANT_MANAGER",
    "plantId": "PLANT_JUAREZ"
  },
  "plants": [
    {
      "id": "PLANT_TANDIL",
      "name": "Sede Central Tandil",
      "silos": ["SILO_T1", "SILO_T2", "SILO_T3"]
    },
    {
      "id": "PLANT_JUAREZ",
      "name": "Sucursal Benito Juárez",
      "silos": ["SILO_J1", "SILO_J2"]
    }
  ]
}
```

### Silo & SensorNode
```json
{
  "id": "SILO_J1",
  "name": "Silo Principal - Trigo",
  "plantId": "PLANT_JUAREZ",
  "capacity": 5000,
  "nodes": [
    {
      "id": "node-01",
      "position": { "x": 0, "y": 5, "z": 0 },
      "metrics": {
      "temperature": 15.5, // °C
      "humidity": 12.0,    // %
      "acousticLevel": 10  // dB (actividad biológica)
      },
    "status": "normal" // 'normal', 'warning', 'critical
    }
  ]
}
```

### AlertEvent
```json
{
  "id": "alert-102",
  "timestamp": "2026-05-29T14:30:00Z",
  "type": "BIO_ACOUSTIC", // 'HEAT', 'HUMIDITY', 'BIO_ACOUSTIC'
  "severity": "CRITICAL",
  "location": { "x": 0, "y": 5, "z": 0 },
  "message": "Actividad biológica anormal detectada en cuadrante sur. Posible plaga.",
  "actionRequired": "Activar ventilación / Inspección visual"
}
```
