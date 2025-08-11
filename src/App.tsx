import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import AuthWrapper from '@/components/AuthWrapper';
import './App.css';

const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthWrapper />
    </AppProvider>
  );
};

export default App;