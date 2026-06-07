import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import LoginScreen from '@/components/auth/LoginScreen';
import MainLayout from '@/components/layout/MainLayout';
import SimulationEngine from '@/components/simulation/SimulationEngine';

function App() {
  const { currentUser, loadPersistedData } = useStore();

  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <>
      <SimulationEngine />
      <MainLayout />
    </>
  );
}

export default App;