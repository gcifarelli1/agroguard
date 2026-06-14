# AgroGuard MVP

> Sistema de Gemelo Digital (Digital Twin) 3D para el monitoreo y control inteligente de silos de acopio de granos en tiempo real.

![Status](https://img.shields.io/badge/status-MVP-yellow)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Three.js-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Descripción

Este proyecto es una **Single Page Application (SPA)** que simula un ecosistema de sensores tridimensionales dentro de silos de almacenamiento agrícola. Permite:

- Visualizar un **Gemelo Digital 3D cilíndrico** de cada silo con 12 nodos de sensores distribuidos en 3 capas.
- Monitorear en tiempo real **temperatura, humedad y actividad bioacústica**.
- Recibir **alertas automáticas** cuando las métricas superan umbrales críticos.
- Inyectar **anomalías manuales** para demostraciones.
- Simular acciones de **mitigación** (ventilación, tratamiento focalizado).
- Gestionar **múltiples plantas** con control de acceso por roles (RBAC simul


## Instalación y uso

### Prerrequisitos

- **Node.js** >= 18
- **npm** >= 9 (o `pnpm` / `yarn`)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/agroguard.git
cd agroguard

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:5173/`.

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con HMR |
| `npm run build` | Compila TypeScript y genera el bundle de producción |
| `npm run preview` | Sirve localmente la build de producción |
| `npm run lint` | Ejecuta ESLint sobre el código fuente |

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | **React 18** + **Vite 5** |
| Lenguaje | **TypeScript 5** |
| Estilos | **Tailwind CSS 3** |
| Estado Global | **Zustand** |
| Render 3D | **Three.js** + **React Three Fiber** + **@react-three/drei** |
| Gráficos | **Recharts** |
| Iconos | **Lucide React** |
| Persistencia | **localStorage** (sesión + historial de alertas, máx 10) |

---

## Estructura del Proyecto

```
agroguard/
├── public/              # Assets estáticos
├── src/
│   ├── components/
│   │   ├── agrotwin/    # Visualizador 3D (Gemelo Digital)
│   │   ├── auth/        # Pantalla de login mock
│   │   ├── dashboard/   # Panel de control, KPIs, gráficos, alertas
│   │   ├── layout/      # Header, Sidebar, MainLayout
│   │   └── simulation/  # Motor de simulación + Inyección de anomalías
│   ├── data/            # Mock data, umbrales, plantas
│   ├── store/           # Zustand store global
│   ├── types/           # Tipos TypeScript compartidos
│   ├── utils/           # Utilidades (cn, formatDate, etc.)
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

---

## Funcionalidades Principales

### 1. Sistema de Login Mock (RBAC)
Dos roles disponibles:
- **Plant Manager (Gerente)**: solo ve los silos de su planta asignada.
- **Global Admin (Administrador)**: acceso irrestricto a todas las plantas.

### 2. Gemelo Digital 3D
- Silo cilíndrico renderizado en 3D con `Three.js`.
- **12 nodos** distribuidos en 3 capas (4 nodos por capa, en ángulos rotados).
- **Capas dinámicas**: si el silo tiene menos del 33% o 66% de carga, las capas superiores se desactivan y se muestran en gris.
- **Click en nodo** → abre tooltip con métricas.
- **Visualización del nivel de grano** dentro del cilindro.

### 3. Motor de Simulación
- Actualización cada **3 segundos** con ruido gaussiano en las métricas.
- **1% de probabilidad** por ciclo de generar una anomalía aleatoria autónoma.
- **Inyección manual** de crisis (Calor, Humedad, Plaga) con intensidad configurable.

### 4. Sistema de Alertas y Mitigación
- Feed de alertas activas con orden por severidad y timestamp.
- Acciones de mitigación: **Activar Ventilación** (reduce temp/hum) o **Aplicar Tratamiento** (reduce actividad bioacústica).
- Historial de las últimas **10 alertas** persistido en `localStorage`.

### 5. Dashboard Analítico
- **KPIs en tiempo real** (Temp, Humedad, Ruido, Capacidad).
- **Gráficos**: tendencia térmica, distribución de estados, actividad bioacústica.
- **Barras de progreso** con conteo de sensores normales/advertencia/críticos.

---

## Umbrales de Alarma

| Métrica | Óptimo | Advertencia | Crítico |
|---------|--------|-------------|---------|
| Temperatura | ≤ 17.0 °C | 17.0 - 24.0 °C | > 24.0 °C |
| Humedad | ≤ 13.0 % | 13.0 - 15.0 % | > 15.0 % |
| Ruido (dB) | ≤ 12.0 | 12.0 - 20.0 | > 20.0 |

---

## Documentación Adicional
- 📋 [`project_description.md`](./project_description.md) - Especificación técnica original

---

## Licencia

MIT © 2026 AgroGuard
