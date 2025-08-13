import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import AuthWrapper from '@/components/AuthWrapper';
import './App.css';

// This is a small change to create a new commit.
const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthWrapper />
    </AppProvider>
  );
};

export default App;