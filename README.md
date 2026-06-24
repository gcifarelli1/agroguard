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
- Gestionar **múltiples plantas** con control de acceso por roles (RBAC simulado).
- Administrar **usuarios, plantas, silos y cereales** desde un panel con CRUD completo.
- Configurar **umbrales de alarma por tipo de cereal**, adaptando la detección al grano almacenado.

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
| Persistencia | **localStorage** (sesión, historial de alertas, CRUD de usuarios/plantas/cereales) |

---

## Estructura del Proyecto

```
agroguard/
├── public/              # Assets estáticos
├── src/
│   ├── components/
│   │   ├── admin/       # Panel de administración y editor de nodos
│   │   ├── agrotwin/    # Visualizador 3D (Gemelo Digital)
│   │   ├── auth/        # Pantalla de login mock
│   │   ├── dashboard/   # Panel de control, KPIs, gráficos, alertas
│   │   ├── layout/      # Header, Sidebar, MainLayout
│   │   └── simulation/  # Motor de simulación + Inyección de anomalías
│   ├── data/            # Mock data, umbrales, JSON de entidades
│   │   └── json/        # users.json, plants.json, silos.json, cereales.json
│   ├── store/           # Zustand store global
│   ├── types/           # Tipos TypeScript compartidos
│   ├── utils/           # Utilidades (cn, formatDate, nodeGeometry, etc.)
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

---

## Funcionalidades Principales

### 1. Sistema de Login Mock (RBAC)
Dos roles disponibles:
- **Plant Manager (Gerente)**: solo ve los silos y alertas de su planta asignada. En el AdminPanel puede gestionar silos y cereales de su planta.
- **Global Admin (Administrador)**: acceso irrestricto a todas las plantas, usuarios y entidades.

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
- Las anomalías respetan los **umbrales del cereal asignado** al silo donde se inyectan.

### 4. Sistema de Alertas y Mitigación
- Feed de alertas activas filtrado por rol: el `Plant Manager` solo ve alertas de su planta.
- Acciones de mitigación: **Activar Ventilación** (reduce temp/hum) o **Aplicar Tratamiento** (reduce actividad bioacústica).
- Historial de las últimas **10 alertas** persistido en `localStorage`.

### 5. Dashboard Analítico
- **KPIs en tiempo real** (Temp, Humedad, Ruido, Capacidad).
- **Gráficos**: tendencia térmica, distribución de estados, actividad bioacústica.
- **Barras de progreso** con conteo de sensores normales/advertencia/críticos.

### 6. Panel de Administración
Accesible desde el header para usuarios autenticados. Organizado en tabs según el rol:

| Tab | Plant Manager | Global Admin |
|-----|:---:|:---:|
| Usuarios | — | ✓ |
| Plantas | — | ✓ |
| Silos | ✓ (solo su planta) | ✓ |
| Cereales | ✓ | ✓ |

- CRUD completo por entidad con modales de alta y edición.
- **Editor de nodos por silo** (`SiloNodeEditor`): activa o desactiva sensores individuales de un silo.
- Los cambios se persisten en `localStorage` y se sincronizan con el store de Zustand en tiempo real.

### 7. Gestión de Cereales
- Entidad `Cereal` con umbrales propios: `tempOptimal`, `tempWarning`, `humOptimal`, `humWarning`.
- Cada silo puede tener un cereal asignado (`cerealType`). Si está asignado, `getNodeStatus()` usa los umbrales del cereal en lugar de los globales.
- Cereales preconfigurados: Trigo, Maíz, Soja, Girasol. Se pueden agregar y editar desde el AdminPanel.

---

## Umbrales de Alarma

Los umbrales globales (usados cuando el silo no tiene cereal asignado):

| Métrica | Óptimo | Advertencia | Crítico |
|---------|--------|-------------|---------|
| Temperatura | ≤ 17.0 °C | 17.0 - 24.0 °C | > 24.0 °C |
| Humedad | ≤ 13.0 % | 13.0 - 15.0 % | > 15.0 % |
| Ruido (dB) | ≤ 12.0 | 12.0 - 20.0 | > 20.0 |

Cuando un silo tiene un cereal asignado, se usan los umbrales de temperatura y humedad de ese cereal. El umbral de ruido es siempre global. Ejemplos de umbrales por cereal:

| Cereal | Temp. óptima | Temp. advertencia | Hum. óptima | Hum. advertencia |
|--------|:---:|:---:|:---:|:---:|
| Trigo | 17 °C | 24 °C | 13 % | 15 % |
| Maíz | 18 °C | 25 °C | 14 % | 16 % |
| Soja | 16 °C | 21 °C | 13 % | 14 % |
| Girasol | 17 °C | 24 °C | 13 % | 15 % |

---

## Endpoint de desarrollo

`vite.config.ts` registra un middleware de Vite que expone **`POST /api/reports`** exclusivamente en modo desarrollo (`npm run dev`). Lo invoca el store desde `applyMitigation()` para guardar un reporte JSON de cada acción de mitigación en el directorio `reports/`. Este endpoint **no existe** en la build de producción ni en `npm run preview`.

---

## Documentación Adicional
- 📋 [`project_description.md`](./project_description.md) - Especificación técnica original

---

## Licencia

MIT © 2026 AgroGuard
