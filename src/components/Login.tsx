import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Globe, Lock, Mail, Shield, ArrowRight, Activity } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (profile: any) => void;
  theme: 'dark' | 'light';
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;
      onLoginSuccess(profile);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const bgColor = theme === 'dark' ? 'bg-[#05070a]' : 'bg-[#f8fafc]';

  return (
    <div className={`min-h-screen ${bgColor} flex items-center justify-center p-6 relative overflow-hidden font-sans`}>
      {/* Luces Ambientales de Fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full"></div>
      
      {/* Grid de Ingeniería de Fondo */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

      <div className="w-full max-w-[440px] z-10">
        {/* Logo y Encabezado */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-6 ring-2 ring-white/10">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            MINE<span className="text-blue-500">CONNECT</span> <span className="font-light">SAT</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-blue-400/60 uppercase tracking-[0.2em] text-[10px] font-bold">
            <Shield className="w-3 h-3" />
            Plataforma de Seguridad Logística
          </div>
        </div>

        {/* Tarjeta de Login (Efecto Vidrio) */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative">
          <div className="absolute top-0 right-10 w-20 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Email Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@mineconnect.com"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Contraseña de Acceso</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-black py-4 rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.2)] flex items-center justify-center gap-3 group transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  INICIAR SESIÓN SEGURA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Técnico */}
        <div className="mt-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500/50" />
            <span className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase">ID SISTEMA: SAT-2026-ARG</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono uppercase">V3.7.0.ENC</span>
        </div>
      </div>
    </div>
  );
};

export default Login;