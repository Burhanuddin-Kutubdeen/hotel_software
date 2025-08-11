import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import LoginScreen from './LoginScreen';
import PasswordChangeScreen from './PasswordChangeScreen';
import AppLayout from './AppLayout';
import { LoadingSpinner } from './LoadingSpinner';

const AuthWrapper: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserStatus(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          checkUserStatus(session.user);
        } else {
          setUser(null);
          setCurrentUser(null); // Clear user from context
          setNeedsPasswordChange(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUserStatus = async (authUser: any) => {
    try {
      // First get user data
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (userError) throw userError;

      // Then get role permissions
      let permissions = [];
      if (userData.role) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', userData.role)
          .single();

        if (!roleError && roleData) {
          permissions = roleData.permissions || [];
        }
      }

      const userWithApp = { 
        ...authUser, 
        appUser: { ...userData, permissions }
      };
      
      setUser(userWithApp);
      setCurrentUser(userWithApp); // Set user in context with fresh data
      
      // Check if password needs to be changed
      setNeedsPasswordChange(!userData.password_changed_at);
    } catch (error) {
      console.error('Error checking user status:', error);
      // Clear any stale data and sign out
      setUser(null);
      setCurrentUser(null);
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
    // Check if this is a first-time login or if password needs changing
    const needsChange = loggedInUser.needsPasswordChange || !loggedInUser.appUser.password_changed_at;
    setNeedsPasswordChange(needsChange);
  };

  const handlePasswordChanged = () => {
    setNeedsPasswordChange(false);
    // Refresh user data
    if (user) {
      checkUserStatus(user);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (needsPasswordChange) {
    return (
      <PasswordChangeScreen 
        user={user} 
        onPasswordChanged={handlePasswordChanged} 
      />
    );
  }

  return <AppLayout />;
};

export default AuthWrapper;