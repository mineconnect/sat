import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, LogOut, Globe, Shield, Smartphone, History } from 'lucide-react';
import DashboardMap from './components/DashboardMap';
import AdminPanel from './components/AdminPanel';
import HistoryPanel from './components/HistoryPanel'; 
import Login from './components/Login';
import type { UserProfile } from './types';
import { saveLocationUpdate, supabase } from './services/supabaseClient';

const DriverSimulator = ({ onClose, user }: { onClose: () => void, user: UserProfile }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [plate, setPlate] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const intervalRef = useRef<any>(null);

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setPlate(value);
  };

  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLogs(p => ["🛑 Viaje finalizado.", "📡 GPS Desconectado.", ...p]);
      setCurrentTripId(null);
    } else {
      if (plate.length < 6) { alert("⚠️ Patente inválida"); return; }
      const newTripId = `TRIP-${plate}-${Date.now()}`;
      setCurrentTripId(newTripId);
      setIsTracking(true);
      setLogs(p => ["🚀 Buscando Satélites...", `✅ Vehículo: ${plate}`, ...p]);
    }
  };

  useEffect(() => {
    if (isTracking && currentTripId) {
      intervalRef.current = setInterval(() => {
        const lat = -34.6037 + (Math.random() - 0.5) * 0.01;
        const lng = -58.3816 + (Math.random() - 0.5) * 0.01;
        const speed = Math.floor(Math.random() * 90);
        saveLocationUpdate(currentTripId, lat, lng, speed, plate, user.company_id || undefined);
        setLogs(p => [`📍 ${new Date().toLocaleTimeString()} | ${speed}km/h`, ...p.slice(0, 5)]);
      }, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTracking, currentTripId, plate, user.company_id]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-blue-950 border border-blue-500/30 w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl relative h-[720px] flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-10"></div>
        <div className="flex-1 p-8 flex flex-col items-center pt-14">
          <Smartphone className="w-12 h-12 text-blue-400 mb-6" />
          <h2 className="text-xl font-black text-white mb-8 tracking-tighter text-center uppercase">MineConnect<br/><span className="text-blue-500">Conductor</span></h2>
          <input 
            type="text" value={plate} onChange={handlePlateChange} disabled={isTracking} placeholder="PATENTE"
            className="w-full bg-slate-950 border-2 border-blue-500/20 rounded-2xl py-5 text-center text-3xl font-mono font-bold text-white mb-10 outline-none focus:border-blue-500"
          />
          <button onClick={toggleTracking} className={`w-44 h-44 rounded-full border-8 flex flex-col items-center justify-center transition-all ${isTracking ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-blue-500 bg-blue-500/10 text-blue-400'}`}>
            <span className="text-2xl font-black">{isTracking ? 'DETENER' : 'INICIAR'}</span>
            <span className="text-[10px] font-bold">VIAJE</span>
          </button>
          <div className="w-full mt-10 bg-black/40 rounded-2xl p-4 h-32 overflow-hidden font-mono text-[10px] text-blue-300/60 border border-blue-500/10">
            {logs.map((l, i) => <div key={i} className="border-b border-white/5 py-1">{l}</div>)}
          </div>
        </div>
        <button onClick={onClose} className="bg-blue-600 text-white py-6 font-black uppercase tracking-widest text-xs">Cerrar Simulación</button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'dashboard' | 'admin' | 'history'>('dashboard');
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) { setCurrentUser(profile); setIsAuthenticated(true); }
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="flex h-screen bg-[#05070a] text-slate-300 font-sans overflow-hidden">
      {showSimulator && currentUser && <DriverSimulator onClose={() => setShowSimulator(false)} user={currentUser} />}
      <aside className="w-20 lg:w-72 bg-slate-900 border-r border-white/5 flex flex-col z-50">
        <div className="p-8 flex items-center gap-3 h-20"><Globe className="w-8 h-8 text-blue-500" /><span className="font-black text-2xl text-white hidden lg:block">MINE<span className="text-blue-500">SAT</span></span></div>
        <nav className="flex-1 px-4 space-y-3 mt-10">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard />} label="Monitoreo" />
          <NavItem active={view === 'history'} onClick={() => setView('history')} icon={<History />} label="Historial" />
          <NavItem active={view === 'admin'} onClick={() => setView('admin')} icon={<Shield />} label="Administración" />
          <button onClick={() => setShowSimulator(true)} className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl font-black text-blue-400 bg-blue-500/5 border border-blue-500/20 mt-10"><Smartphone className="w-6 h-6" /><span className="hidden lg:block text-xs uppercase tracking-widest">App Conductor</span></button>
        </nav>
        <div className="p-6 border-t border-white/5"><button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-3 text-slate-500 hover:text-white transition-all font-bold text-sm"><LogOut className="w-5 h-5" /><span className="hidden lg:block">Cerrar Sesión</span></button></div>
      </aside>
      <main className="flex-1 flex flex-col h-full bg-[#080a0f] relative overflow-hidden">
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-10 z-10">
          <h1 className="text-xl font-black text-white uppercase">{view === 'dashboard' ? 'Centro de Control' : view === 'history' ? 'Historial de Viajes' : 'Gestión Maestra'}</h1>
          <div className="flex items-center gap-4 text-right">
            <div><p className="text-[10px] text-slate-500 font-bold">USUARIO ACTIVO</p><p className="text-xs font-bold text-blue-500">{currentUser?.full_name}</p></div>
            <img className="w-10 h-10 rounded-full border border-blue-500/50" src={`https://ui-avatars.com/api/?name=${currentUser?.full_name}&background=1d4ed8&color=fff`} />
          </div>
        </header>
        <div className="flex-1 overflow-hidden z-10">
          {view === 'dashboard' && <DashboardMap />}
          {view === 'admin' && <AdminPanel currentUser={currentUser} />}
          {view === 'history' && <HistoryPanel user={currentUser} />}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    {React.cloneElement(icon, { size: 22 })}
    <span className="hidden lg:block text-xs uppercase tracking-widest">{label}</span>
  </button>
);

export default App;