import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import AuthWrapper from '@/components/AuthWrapper';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthWrapper />
      <Toaster />
    </AppProvider>
  );
};

export default App;