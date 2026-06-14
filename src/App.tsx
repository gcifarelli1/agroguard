import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import LoginScreen from '@/components/auth/LoginScreen';
import MainLayout from '@/components/layout/MainLayout';
import SimulationEngine from '@/components/simulation/SimulationEngine';
import AdminPanel from '@/components/admin/AdminPanel';

type ViewMode = 'dashboard' | 'admin';

function App() {
  const { currentUser, loadPersistedData } = useStore();
  const [view, setView] = useState<ViewMode>('dashboard');

  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <>
      <SimulationEngine />
      {view === 'admin' ? (
        <AdminPanel onBack={() => setView('dashboard')} />
      ) : (
        <MainLayout onNavigateToAdmin={() => setView('admin')} />
      )}
    </>
  );
}

export default App;