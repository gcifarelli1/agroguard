import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { User, Plant, Silo, Cereal } from '@/types';
import { cn } from '@/utils/helpers';
import SiloNodeEditor from './SiloNodeEditor';
import {
  X, Plus, Edit2, Trash2, Shield, Building2, Package, Wheat,
  UserPlus, ArrowRight, Check, ChevronDown, Layers,
} from 'lucide-react';

type Tab = 'users' | 'plants' | 'silos' | 'cereals';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground',
        'placeholder:text-muted-foreground/50',
        'focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50',
        'transition-colors',
        className
      )}
      {...props}
    />
  );
}

function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground appearance-none',
          'focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50',
          'transition-colors cursor-pointer',
          className
        )}
        {...props}
      />
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function ActionButton({ onClick, variant = 'default', children, title }: {
  onClick: () => void;
  variant?: 'default' | 'danger';
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95',
        variant === 'danger'
          ? 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
          : 'hover:bg-accent text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

// La cuenta de administrador de fábrica no puede eliminarse para evitar bloqueos del sistema.
const PROTECTED_ADMIN_ID = 'u-03';

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const store = useStore();
  const isAdmin = store.currentUser?.role === 'GLOBAL_ADMIN';
  const managerPlantId = store.currentUser?.plantId;
  const adminActiveTab = useStore((s) => s.adminActiveTab);
  const setAdminActiveTab = useStore((s) => s.setAdminActiveTab);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [siloForNodeEditor, setSiloForNodeEditor] = useState<Silo | null>(null);

  // Form states for Add
  const [formAdd, setFormAdd] = useState<any>({});

  // Load data from localStorage on mount
  const [users, setUsers] = useState<User[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [cereals, setCereals] = useState<Cereal[]>([]);

  useEffect(() => {
    setUsers(store.cereals ? [] : []);
    const uStr = localStorage.getItem('agroguard_users');
    const pStr = localStorage.getItem('agroguard_plants');
    const cStr = localStorage.getItem('agroguard_cereals');
    setUsers(uStr ? JSON.parse(uStr) : []);
    setPlants(pStr ? JSON.parse(pStr) : []);
    setCereals(cStr ? JSON.parse(cStr) : store.cereals);
  }, [store.cereals]);

  const reloadData = () => {
    const uStr = localStorage.getItem('agroguard_users');
    const pStr = localStorage.getItem('agroguard_plants');
    const cStr = localStorage.getItem('agroguard_cereals');
    if (uStr) setUsers(JSON.parse(uStr));
    if (pStr) setPlants(JSON.parse(pStr));
    if (cStr) setCereals(JSON.parse(cStr));
    else setCereals(store.cereals);
  };

  const allTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'Usuarios', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'plants', label: 'Sedes', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'silos', label: 'Silos', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'cereals', label: 'Cereales', icon: <Wheat className="w-3.5 h-3.5" /> },
  ];
  // Los gerentes de planta solo gestionan silos y cereales (no usuarios ni sedes).
  const tabs = isAdmin ? allTabs : allTabs.filter((t) => t.id === 'silos' || t.id === 'cereals');

  // Silos visibles según el rol: el gerente solo ve los de su sede asignada.
  const visibleSilos = isAdmin ? store.silos : store.silos.filter((s) => s.plantId === managerPlantId);
  // Sedes seleccionables en formularios de silos: el gerente queda fijado a la suya.
  const selectablePlants = isAdmin ? plants : plants.filter((p) => p.id === managerPlantId);

  // Si un gerente quedara en una pestaña restringida, lo devolvemos a Silos.
  useEffect(() => {
    if (!isAdmin && (adminActiveTab === 'users' || adminActiveTab === 'plants')) {
      setAdminActiveTab('silos');
    }
  }, [isAdmin, adminActiveTab]);

  // --- USERS CRUD ---
  const handleAddUser = () => {
    if (!formAdd.name?.trim()) return;
    const newUser: User = {
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: formAdd.name,
      role: formAdd.role || 'PLANT_MANAGER',
      plantId: formAdd.plantId || store.currentUser?.plantId || 'PLANT_JUAREZ',
    };
    store.addUser(newUser);
    setShowAddModal(false);
    reloadData();
  };

  const openEditUser = (user: User) => {
    setEditingItem(user);
    setFormAdd({ name: user.name, role: user.role, plantId: user.plantId });
    setShowEditModal(true);
  };

  const handleEditUser = () => {
    if (!editingItem || !formAdd.name?.trim()) return;
    store.updateUser(editingItem.id, { name: formAdd.name, role: formAdd.role, plantId: formAdd.plantId });
    setShowEditModal(false);
    setEditingItem(null);
    reloadData();
  };

  const handleDeleteUser = (id: string) => {
    if (id === PROTECTED_ADMIN_ID) {
      alert('La cuenta de administrador de fábrica está protegida y no puede eliminarse.');
      return;
    }
    if (confirm('¿Eliminar este usuario?')) {
      store.deleteUser(id);
      reloadData();
    }
  };

  // --- PLANTS CRUD ---
  const handleAddPlant = () => {
    if (!formAdd.name?.trim()) return;
    const newPlant: Plant = {
      id: `plant-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: formAdd.name,
      location: formAdd.location || '',
      silos: [],
    };
    store.addPlant(newPlant);
    setShowAddModal(false);
    reloadData();
  };

  const openEditPlant = (plant: Plant) => {
    setEditingItem(plant);
    setFormAdd({ name: plant.name, location: plant.location });
    setShowEditModal(true);
  };

  const handleEditPlant = () => {
    if (!editingItem || !formAdd.name?.trim()) return;
    store.updatePlant(editingItem.id, { name: formAdd.name, location: formAdd.location });
    setShowEditModal(false);
    setEditingItem(null);
    reloadData();
  };

  const handleDeletePlant = (id: string) => {
    if (confirm('¿Eliminar esta sede? Se eliminarán también sus silos.')) {
      store.deletePlant(id);
      reloadData();
    }
  };

  // --- SILOS CRUD ---
  const handleAddSilo = () => {
    if (!formAdd.name?.trim()) return;
    if (parseFloat(formAdd.currentLevel) > parseFloat(formAdd.capacity)) {
      alert('El nivel actual no puede superar la capacidad máxima.');
      return;
    }
    const newSilo: Silo = {
      id: `silo-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: formAdd.name,
      plantId: formAdd.plantId,
      capacity: Number(formAdd.capacity) || 3000,
      currentLevel: Number(formAdd.currentLevel) || 0,
      cerealType: formAdd.cerealType,
      layerCount: Number(formAdd.layerCount) || 3,
      nodes: [],
    };
    store.addSilo(newSilo);
    setShowAddModal(false);
    reloadData();
  };

  const openEditSilo = (silo: Silo) => {
    setEditingItem(silo);
    setSiloForNodeEditor(silo);
    setFormAdd({ name: silo.name, plantId: silo.plantId, capacity: silo.capacity, currentLevel: silo.currentLevel, cerealType: silo.cerealType || 'trigo', layerCount: silo.layerCount || 3 });
    setShowEditModal(true);
  };

  const handleEditSilo = () => {
    if (!editingItem || !formAdd.name?.trim()) return;
    if (parseFloat(formAdd.currentLevel) > parseFloat(formAdd.capacity)) {
      alert('El nivel actual no puede superar la capacidad máxima.');
      return;
    }
    const newLayerCount = Number(formAdd.layerCount);
    const layerCountChanged = newLayerCount !== (editingItem as Silo).layerCount;
    if (layerCountChanged) {
      const confirmed = window.confirm(
        `Cambiar las capas de ${(editingItem as Silo).layerCount} a ${newLayerCount} eliminará los nodos actuales y los regenerará. ¿Continuar?`
      );
      if (!confirmed) {
        setFormAdd((f: any) => ({ ...f, layerCount: String((editingItem as Silo).layerCount) }));
        return;
      }
      store.regenerateSiloNodes((editingItem as Silo).id, newLayerCount);
    }
    store.updateSilo(editingItem.id, {
      name: formAdd.name,
      plantId: formAdd.plantId,
      capacity: Number(formAdd.capacity),
      currentLevel: Number(formAdd.currentLevel),
      cerealType: formAdd.cerealType,
      layerCount: newLayerCount,
    });
    setShowEditModal(false);
    setEditingItem(null);
    reloadData();
  };

  const handleDeleteSilo = (id: string) => {
    if (confirm('¿Eliminar este silo?')) {
      store.deleteSilo(id);
      reloadData();
    }
  };

  // --- CEREALS CRUD ---
  const handleAddCereal = () => {
    if (!formAdd.name?.trim()) return;
    const newCereal: Cereal = {
      id: `cereal-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: formAdd.name,
      tempOptimal: Number(formAdd.tempOptimal) || 17,
      tempWarning: Number(formAdd.tempWarning) || 24,
      humOptimal: Number(formAdd.humOptimal) || 13,
      humWarning: Number(formAdd.humWarning) || 15,
    };
    store.addCereal(newCereal);
    setShowAddModal(false);
    reloadData();
  };

  const openEditCereal = (cereal: Cereal) => {
    setEditingItem(cereal);
    setFormAdd({
      name: cereal.name,
      tempOptimal: cereal.tempOptimal,
      tempWarning: cereal.tempWarning,
      humOptimal: cereal.humOptimal,
      humWarning: cereal.humWarning,
    });
    setShowEditModal(true);
  };

  const handleEditCereal = () => {
    if (!editingItem || !formAdd.name?.trim()) return;
    store.updateCereal(editingItem.id, {
      name: formAdd.name,
      tempOptimal: Number(formAdd.tempOptimal),
      tempWarning: Number(formAdd.tempWarning),
      humOptimal: Number(formAdd.humOptimal),
      humWarning: Number(formAdd.humWarning),
    });
    setShowEditModal(false);
    setEditingItem(null);
    reloadData();
  };

  const handleDeleteCereal = (id: string) => {
    if (confirm('¿Eliminar este cereal?')) {
      store.deleteCereal(id);
      reloadData();
    }
  };

  const handleOpenAdd = () => {
    switch (adminActiveTab) {
      case 'users':
        setFormAdd({ name: '', role: 'PLANT_MANAGER', plantId: store.currentUser?.plantId || 'PLANT_JUAREZ' });
        break;
      case 'plants':
        setFormAdd({ name: '', location: '' });
        break;
      case 'silos':
        setFormAdd({ name: '', plantId: store.currentUser?.role === 'GLOBAL_ADMIN' ? 'PLANT_JUAREZ' : store.currentUser?.plantId || 'PLANT_JUAREZ', capacity: 3000, currentLevel: 0, cerealType: 'trigo', layerCount: 3 });
        break;
      case 'cereals':
        setFormAdd({ name: '', tempOptimal: 17, tempWarning: 24, humOptimal: 13, humWarning: 15 });
        break;
    }
    setShowAddModal(true);
  };

  // Generic Add form renderer
  const renderAddForm = () => {
    switch (adminActiveTab) {
      case 'users':
        return (
          <>
            <FormField label="Nombre">
              <Input
                value={formAdd.name || ''}
                onChange={(e) => setFormAdd({ ...formAdd, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </FormField>
            <FormField label="Rol">
              <Select
                value={formAdd.role || 'PLANT_MANAGER'}
                onChange={(e) => setFormAdd({ ...formAdd, role: e.target.value as any })}
              >
                <option value="PLANT_MANAGER">Gerente de Planta</option>
                <option value="GLOBAL_ADMIN">Administrador Global</option>
              </Select>
            </FormField>
            <FormField label="Sede">
              <Select
                value={formAdd.plantId || 'PLANT_JUAREZ'}
                onChange={(e) => setFormAdd({ ...formAdd, plantId: e.target.value })}
              >
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="ALL">Todas las Sedes (Admin)</option>
              </Select>
            </FormField>
            <button
              onClick={handleAddUser}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-medium transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Crear Usuario
            </button>
          </>
        );
      case 'plants':
        return (
          <>
            <FormField label="Nombre de la Sede">
              <Input
                value={formAdd.name || ''}
                onChange={(e) => setFormAdd({ ...formAdd, name: e.target.value })}
                placeholder="Ej: Sucursal Tres Arroyos"
              />
            </FormField>
            <FormField label="Ubicación">
              <Input
                value={formAdd.location || ''}
                onChange={(e) => setFormAdd({ ...formAdd, location: e.target.value })}
                placeholder="Ej: Tres Arroyos, Buenos Aires"
              />
            </FormField>
            <button
              onClick={handleAddPlant}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-medium transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              Crear Sede
            </button>
          </>
        );
      case 'silos':
        return (
          <>
            <FormField label="Nombre">
              <Input
                value={formAdd.name || ''}
                onChange={(e) => setFormAdd({ ...formAdd, name: e.target.value })}
                placeholder="Ej: Silo Nuevo - Trigo"
              />
            </FormField>
            <FormField label="Sede">
              <Select
                value={formAdd.plantId || 'PLANT_JUAREZ'}
                onChange={(e) => setFormAdd({ ...formAdd, plantId: e.target.value })}
                disabled={!isAdmin}
              >
                {selectablePlants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Capacidad (toneladas)">
              <Input
                type="number"
                value={formAdd.capacity || 3000}
                onChange={(e) => setFormAdd({ ...formAdd, capacity: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Nivel Actual (toneladas)">
              <Input
                type="number"
                value={formAdd.currentLevel || 0}
                onChange={(e) => setFormAdd({ ...formAdd, currentLevel: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Cereal">
              <Select
                value={formAdd.cerealType || 'trigo'}
                onChange={(e) => setFormAdd({ ...formAdd, cerealType: e.target.value })}
              >
                {cereals.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="N° de Capas">
              <Select
                value={formAdd.layerCount || 3}
                onChange={(e) => setFormAdd({ ...formAdd, layerCount: Number(e.target.value) })}
              >
                <option value={2}>2 capas</option>
                <option value={3}>3 capas</option>
                <option value={4}>4 capas</option>
              </Select>
            </FormField>
            <button
              onClick={handleAddSilo}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-medium transition-all"
            >
              <Package className="w-3.5 h-3.5" />
              Crear Silo
            </button>
          </>
        );
      case 'cereals':
        return (
          <>
            <FormField label="Nombre del Cereal">
              <Input
                value={formAdd.name || ''}
                onChange={(e) => setFormAdd({ ...formAdd, name: e.target.value })}
                placeholder="Ej: Cebada"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Temp. Óptima (°C)">
                <Input
                  type="number"
                  step="0.1"
                  value={formAdd.tempOptimal || 17}
                  onChange={(e) => setFormAdd({ ...formAdd, tempOptimal: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Temp. Alerta (°C)">
                <Input
                  type="number"
                  step="0.1"
                  value={formAdd.tempWarning || 24}
                  onChange={(e) => setFormAdd({ ...formAdd, tempWarning: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Hum. Óptima (%)">
                <Input
                  type="number"
                  step="0.1"
                  value={formAdd.humOptimal || 13}
                  onChange={(e) => setFormAdd({ ...formAdd, humOptimal: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Hum. Alerta (%)">
                <Input
                  type="number"
                  step="0.1"
                  value={formAdd.humWarning || 15}
                  onChange={(e) => setFormAdd({ ...formAdd, humWarning: Number(e.target.value) })}
                />
              </FormField>
            </div>
            <button
              onClick={handleAddCereal}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-medium transition-all"
            >
              <Wheat className="w-3.5 h-3.5" />
              Crear Cereal
            </button>
          </>
        );
    }
  };

  // Generic Edit form renderer
  const renderEditForm = () => {
    if (!editingItem) return null;
    switch (adminActiveTab) {
      case 'users':
        return (
          <>
            <FormField label="Nombre">
              <Input
                value={formAdd.name || ''}
                onChange={(e) => setFormAdd({ ...formAdd, name: e.target.value })}
              />
            </FormField>
            <FormField label="Rol">
              <Select
                value={formAdd.role || 'PLANT_MANAGER'}
                onChange={(e) => setFormAdd({ ...formAdd, role: e.target.value as any })}
              >
                <option value="PLANT_MANAGER">Gerente de Planta</option>
                <option value="GLOBAL_ADMIN">Administrador Global</option>
              </Select>
            </FormField>
            <FormField label="Sede">
              <Select
                value={formAdd.plantId || 'PLANT_JUAREZ'}
                onChange={(e) => setFormAdd({ ...formAdd, plantId: e.target.value })}
              >
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="ALL">Todas las Sedes</option>
              </Select>
            </FormField>
            <button
              onClick={handleEditUser}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar Cambios
            </button>
          </>
        );
      case 'plants':
        return (
          <>
            <FormField label="Nombre">
              <Input
                value={formAdd.name || ''}
                onChange={(e) => setFormAdd({ ...formAdd, name: e.target.value })}
              />
            </FormField>
            <FormField label="Ubicación">
              <Input
                value={formAdd.location || ''}
                onChange={(e) => setFormAdd({ ...formAdd, location: e.target.value })}
              />
            </FormField>
            <button
              onClick={handleEditPlant}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar Cambios
            </button>
          </>
        );
      case 'silos':
        return (
          <>
            <FormField label="Nombre">
              <Input
                value={formAdd.name || ''}
                onChange={(e) => setFormAdd({ ...formAdd, name: e.target.value })}
              />
            </FormField>
            <FormField label="Sede">
              <Select
                value={formAdd.plantId || 'PLANT_JUAREZ'}
                onChange={(e) => setFormAdd({ ...formAdd, plantId: e.target.value })}
                disabled={!isAdmin}
              >
                {selectablePlants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Capacidad (t)">
                <Input
                  type="number"
                  value={formAdd.capacity || 0}
                  onChange={(e) => setFormAdd({ ...formAdd, capacity: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Nivel Actual (t)">
                <Input
                  type="number"
                  value={formAdd.currentLevel || 0}
                  onChange={(e) => setFormAdd({ ...formAdd, currentLevel: Number(e.target.value) })}
                />
              </FormField>
            </div>
            <FormField label="Cereal">
              <Select
                value={formAdd.cerealType || 'trigo'}
                onChange={(e) => setFormAdd({ ...formAdd, cerealType: e.target.value })}
              >
                {cereals.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="N° de Capas">
              <Select
                value={formAdd.layerCount || 3}
                onChange={(e) => setFormAdd({ ...formAdd, layerCount: Number(e.target.value) })}
              >
                <option value={2}>2 capas</option>
                <option value={3}>3 capas</option>
                <option value={4}>4 capas</option>
              </Select>
            </FormField>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setSiloForNodeEditor(editingItem); setShowNodeEditor(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-medium transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                Configurar Nodos
              </button>
              <button
                type="button"
                onClick={handleEditSilo}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Guardar
              </button>
            </div>
          </>
        );
      case 'cereals':
        return (
          <>
            <FormField label="Nombre">
              <Input
                value={formAdd.name || ''}
                onChange={(e) => setFormAdd({ ...formAdd, name: e.target.value })}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Temp. Óptima (°C)">
                <Input
                  type="number"
                  step="0.1"
                  value={formAdd.tempOptimal || 17}
                  onChange={(e) => setFormAdd({ ...formAdd, tempOptimal: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Temp. Alerta (°C)">
                <Input
                  type="number"
                  step="0.1"
                  value={formAdd.tempWarning || 24}
                  onChange={(e) => setFormAdd({ ...formAdd, tempWarning: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Hum. Óptima (%)">
                <Input
                  type="number"
                  step="0.1"
                  value={formAdd.humOptimal || 13}
                  onChange={(e) => setFormAdd({ ...formAdd, humOptimal: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Hum. Alerta (%)">
                <Input
                  type="number"
                  step="0.1"
                  value={formAdd.humWarning || 15}
                  onChange={(e) => setFormAdd({ ...formAdd, humWarning: Number(e.target.value) })}
                />
              </FormField>
            </div>
            <button
              onClick={handleEditCereal}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar Cambios
            </button>
          </>
        );
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (adminActiveTab) {
      case 'users':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Nombre</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Rol</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Sede</th>
                  <th className="text-right py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const plant = plants.find((p) => p.id === user.plantId);
                  return (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="py-2 px-2 text-foreground font-medium">{user.name}</td>
                      <td className="py-2 px-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          user.role === 'GLOBAL_ADMIN' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'
                        )}>
                          {user.role === 'GLOBAL_ADMIN' ? 'Admin Global' : 'Gerente'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{plant?.name || 'Todas'}</td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton onClick={() => openEditUser(user)} title="Editar">
                            <Edit2 className="w-3.5 h-3.5" />
                          </ActionButton>
                          {user.id === PROTECTED_ADMIN_ID ? (
                            <span
                              title="Cuenta de administrador de fábrica protegida"
                              className="p-1.5 rounded-lg text-muted-foreground/30 cursor-not-allowed inline-flex"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <ActionButton onClick={() => handleDeleteUser(user.id)} variant="danger" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5" />
                            </ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Sin usuarios cargados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'plants':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Nombre</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Ubicación</th>
                  <th className="text-right py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {plants.map((plant) => (
                  <tr key={plant.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                    <td className="py-2 px-2 text-foreground font-medium">{plant.name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{plant.location || '—'}</td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton onClick={() => openEditPlant(plant)} title="Editar">
                          <Edit2 className="w-3.5 h-3.5" />
                        </ActionButton>
                        <ActionButton onClick={() => handleDeletePlant(plant.id)} variant="danger" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {plants.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      Sin sedes cargadas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'silos':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Nombre</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Sede</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Cereal</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Capacidad</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Nivel</th>
                  <th className="text-right py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleSilos.map((silo) => {
                  const plant = plants.find((p) => p.id === silo.plantId);
                  const cereal = cereals.find((c) => c.id === silo.cerealType);
                  const fillPct = Math.round((silo.currentLevel / silo.capacity) * 100);
                  return (
                    <tr key={silo.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="py-2 px-2 text-foreground font-medium">{silo.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{plant?.name || '—'}</td>
                      <td className="py-2 px-2 text-muted-foreground">{cereal?.name || silo.cerealType || '—'}</td>
                      <td className="py-2 px-2 text-muted-foreground">{silo.capacity.toLocaleString()} t</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[60px]">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                fillPct > 90 ? 'bg-destructive' : fillPct > 70 ? 'bg-yellow-500' : 'bg-primary'
                              )}
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground font-mono text-[10px]">{fillPct}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton onClick={() => openEditSilo(silo)} title="Editar">
                            <Edit2 className="w-3.5 h-3.5" />
                          </ActionButton>
                          <ActionButton onClick={() => handleDeleteSilo(silo.id)} variant="danger" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleSilos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Sin silos cargados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'cereals':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Nombre</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Temp. Ópt.</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Temp. Alerta</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Hum. Ópt.</th>
                  <th className="text-left py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Hum. Alerta</th>
                  <th className="text-right py-2 px-2 font-mono text-muted-foreground uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cereals.map((cereal) => (
                  <tr key={cereal.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                    <td className="py-2 px-2 text-foreground font-medium">{cereal.name}</td>
                    <td className="py-2 px-2 text-muted-foreground font-mono">{cereal.tempOptimal}°C</td>
                    <td className="py-2 px-2 text-yellow-500 font-mono">{cereal.tempWarning}°C</td>
                    <td className="py-2 px-2 text-muted-foreground font-mono">{cereal.humOptimal}%</td>
                    <td className="py-2 px-2 text-yellow-500 font-mono">{cereal.humWarning}%</td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton onClick={() => openEditCereal(cereal)} title="Editar">
                          <Edit2 className="w-3.5 h-3.5" />
                        </ActionButton>
                        <ActionButton onClick={() => handleDeleteCereal(cereal.id)} variant="danger" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {cereals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Sin cereales cargados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
    }
  };

  const getTabModalTitle = () => {
    switch (adminActiveTab) {
      case 'users': return 'Nuevo Usuario';
      case 'plants': return 'Nueva Sede';
      case 'silos': return 'Nuevo Silo';
      case 'cereals': return 'Nuevo Cereal';
    }
  };

  const getEditModalTitle = () => {
    if (!editingItem) return '';
    switch (adminActiveTab) {
      case 'users': return 'Editar Usuario';
      case 'plants': return 'Editar Sede';
      case 'silos': return 'Editar Silo';
      case 'cereals': return 'Editar Cereal';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <header className="relative h-14 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Volver</span>
          </button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground text-sm">Panel de Administración</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <span className="text-xs text-foreground font-medium">{store.currentUser?.name}</span>
        </div>
      </header>

      <div className="relative flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-card/40 backdrop-blur border border-border rounded-lg p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdminActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all',
                  adminActiveTab === tab.id
                    ? 'bg-primary/20 text-primary shadow-[0_0_12px_rgba(34,197,94,0.1)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-card/60 backdrop-blur border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground capitalize">{tabs.find((t) => t.id === adminActiveTab)?.label}</h3>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-medium transition-all hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={getTabModalTitle()}>
        <div className="space-y-3">{renderAddForm()}</div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingItem(null); }} title={getEditModalTitle()}>
        <div className="space-y-3">{renderEditForm()}</div>
      </Modal>

      {/* Editor de Nodos (disponible desde la edición de cualquier silo) */}
      {showNodeEditor && siloForNodeEditor && (
        <SiloNodeEditor
          silo={store.silos.find((s) => s.id === siloForNodeEditor.id) || siloForNodeEditor}
          onClose={() => { setShowNodeEditor(false); setSiloForNodeEditor(null); reloadData(); }}
        />
      )}
    </div>
  );
}