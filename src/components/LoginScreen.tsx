import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, try normal login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authData.user) {
        // Normal login successful - get user data with role permissions
        const { data: userData, error: userError } = await supabase
          .from('app_users')
          .select('*')
          .eq('auth_id', authData.user.id)
          .single();

        if (userError) throw userError;

        // Get role permissions
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

        onLogin({ 
          ...authData.user, 
          appUser: { ...userData, permissions }
        });
        return;
      }

      // If normal login fails, try first-time login
      if (authError?.message.includes('Invalid login credentials')) {
        const { data: firstTimeData, error: firstTimeError } = await supabase.functions.invoke(
          'first-time-login',
          {
            body: { email, tempPassword: password }
          }
        );

        if (firstTimeError || !firstTimeData.success) {
          throw new Error('Invalid login credentials');
        }

        // Now sign in with the created credentials
        const { data: newAuthData, error: newAuthError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (newAuthError) throw newAuthError;

        if (newAuthData.user) {
          onLogin({ 
            ...newAuthData.user, 
            appUser: firstTimeData.user,
            needsPasswordChange: firstTimeData.needsPasswordChange
          });
        }
      } else {
        throw authError;
      }
    } catch (error: any) {
      setError(error.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
            <LogIn className="w-6 h-6 text-teal-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Hotel Management System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;