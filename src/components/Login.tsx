import React, { useState } from 'react';
import { Globe, Lock, Mail, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import type { UserProfile } from '../types';

interface LoginProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const performProfileFetch = async (userId: string) => {
    // 2. Fetch User Profile for Role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
            // Safety net: If profile is missing but it's the admin, auto-create the profile entry
        if (!profile && email === 'fbarrosmarengo@gmail.com') {
            const superAdminProfile = {
                id: userId,
                email: email,
                role: 'super_admin',
                full_name: 'Francisco Barros',
                company_id: null
            };
            await supabase.from('profiles').upsert(superAdminProfile);
            return superAdminProfile;
        }
    if (profileError) throw new Error("Perfil de usuario no encontrado. Contacte soporte.");
    return profile;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const profile = await performProfileFetch(data.user.id);
        onLoginSuccess(profile);
      }
    } catch (error: any) {
      setError(error.message === 'Invalid login credentials' ? 'Credenciales inválidas.' : error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      </div>

      <div className="bg-surface-primary/50 backdrop-blur-lg border border-border-primary/50 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-on-surface-primary tracking-tight">MineConnect <span className="text-primary">SAT</span></h1>
          <p className="text-on-surface-secondary text-sm mt-2">Plataforma de Seguridad Logística</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-on-surface-secondary text-xs font-bold uppercase mb-2 ml-1">Email Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-on-surface-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-secondary border border-border-secondary text-on-surface-primary pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-on-surface-secondary"
                placeholder="usuario@empresa.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-on-surface-secondary text-xs font-bold uppercase mb-2 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-on-surface-secondary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-secondary border border-border-secondary text-on-surface-primary pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-on-surface-secondary"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                  <p>{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            {loading ? 'Autenticando...' : 'Iniciar Sesión Segura'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6">
           <p className="text-on-surface-secondary text-xs">
             Acceso restringido únicamente a personal autorizado.
             <br />
             ID de Sistema: <span className="font-mono text-on-surface-secondary/70">SAT-2024-ARG</span>
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
