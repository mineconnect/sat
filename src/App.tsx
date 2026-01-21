import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, LogOut, Globe, Shield, Smartphone, History, Sun, Moon, Activity
} from 'lucide-react';
import DashboardMap from './components/DashboardMap';
import AdminPanel from './components/AdminPanel';
import HistoryPanel from './components/HistoryPanel'; 
import Login from './components/Login';
import type { UserProfile } from './types';
import { saveLocationUpdate, supabase } from './services/supabaseClient';

// Simulador de Conductor Refactorizado
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
      if (plate.length < 6) { 
        alert("⚠️ Patente inválida. Debe contener al menos 6 caracteres alfanuméricos."); 
        return; 
      }
      const newTripId = `TRIP-${plate}-${Date.now()}`;
      setCurrentTripId(newTripId);
      setIsTracking(true);
      setLogs(p => [`🚀 Iniciando viaje para ${plate}`, "🛰️ Buscando Satélites...", ...p]);
    }
  };

  useEffect(() => {
    if (isTracking && currentTripId) {
      intervalRef.current = setInterval(() => {
        const lat = -34.6037 + (Math.random() - 0.5) * 0.02;
        const lng = -58.3816 + (Math.random() - 0.5) * 0.02;
        const speed = Math.floor(Math.random() * 100);
        saveLocationUpdate(currentTripId, lat, lng, speed, plate, user.company_id || undefined);
        setLogs(p => [`📍 ${new Date().toLocaleTimeString()} | ${speed} km/h`, ...p.slice(0, 10)]);
      }, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTracking, currentTripId, plate, user.company_id]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-blue-500/30 w-full max-w-sm rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex-shrink-0 p-6 pt-8 text-center relative">
            <Smartphone className="w-10 h-10 text-blue-400 mb-2 mx-auto" />
            <h2 className="text-lg font-bold text-white uppercase">Simulador de Conductor</h2>
        </div>

        <div className="flex-grow p-6 flex flex-col items-center overflow-y-auto custom-scrollbar">
          <input 
            type="text" value={plate} onChange={handlePlateChange} disabled={isTracking} placeholder="PATENTE"
            className="w-full bg-slate-950 border-2 border-blue-500/20 rounded-xl py-4 text-center text-2xl font-mono font-bold text-white mb-6 outline-none focus:border-blue-500"
          />
          <button onClick={toggleTracking} className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all ${isTracking ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-blue-500 bg-blue-500/10 text-blue-400'}`}>
            <span className="text-xl font-black">{isTracking ? 'DETENER' : 'INICIAR'}</span>
            <span className="text-sm font-bold">VIAJE</span>
          </button>
          <div className="w-full mt-6 bg-black/40 rounded-xl p-3 text-xs font-mono text-slate-400 border border-blue-500/10 h-40 overflow-y-auto">
            {logs.map((l, i) => <div key={i} className="border-b border-white/5 py-1 animate-in fade-in">{l}</div>)}
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-blue-500/10 mt-auto sticky bottom-0 bg-slate-900 rounded-b-3xl">
          <button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-4 font-bold uppercase tracking-widest text-xs rounded-lg transition-colors">Cerrar Simulación</button>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'dashboard' | 'admin' | 'history'>('dashboard');
  const [showSimulator, setShowSimulator] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Recupera la sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error.message);
        setIsAuthenticated(false);
        setCurrentUser(null);
        return;
      }

      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          setIsAuthenticated(false);
          setCurrentUser(null);
        } else if (profile) {
            setCurrentUser(profile);
            setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };

    checkSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            checkSession();
        } else {
            setIsAuthenticated(false);
            setCurrentUser(null);
        }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
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

  const toggleTheme = () => {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'));
  };

  if (!isAuthenticated || !currentUser) return <Login onLoginSuccess={handleLoginSuccess} theme={theme} />;

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${theme === 'dark' ? 'dark bg-[#05070a] text-slate-300' : 'bg-[#f8fafc] text-slate-800'}`}>
      {showSimulator && <DriverSimulator onClose={() => setShowSimulator(false)} user={currentUser} />}
      
      <aside className={`w-20 lg:w-72 flex flex-col z-50 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#05070a] border-r border-white/5' : 'bg-slate-100 border-r border-slate-200'}`}>
        <div className="p-8 flex items-center gap-3 h-20"><Globe className="w-8 h-8 text-blue-500" /><span className={`font-black text-2xl hidden lg:block ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>MINE<span className="text-blue-500">SAT</span></span></div>
        <nav className="flex-1 px-4 space-y-3 mt-10">
          <NavItem theme={theme} active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard />} label="Monitoreo" />
          <NavItem theme={theme} active={view === 'history'} onClick={() => setView('history')} icon={<History />} label="Historial" />
          <NavItem theme={theme} active={view === 'admin'} onClick={() => setView('admin')} icon={<Shield />} label="Administración" />
          <button onClick={() => setShowSimulator(true)} className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl font-black text-blue-500 mt-10 transition-colors ${theme === 'dark' ? 'bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10' : 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20'}`}><Smartphone className="w-6 h-6" /><span className="hidden lg:block text-xs uppercase tracking-widest">App Conductor</span></button>
        </nav>
        <div className={`p-6 border-t transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
          <button onClick={handleLogout} className={`w-full flex items-center gap-4 px-5 py-3 font-bold text-sm transition-all ${theme === 'dark' ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <LogOut className="w-5 h-5" /><span className="hidden lg:block">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      
      <main className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors ${theme === 'dark' ? 'bg-[#05070a]' : 'bg-white'}`}>
        <header className={`h-20 backdrop-blur-md border-b flex items-center justify-between px-10 z-10 transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-white/50 border-slate-200'}`}>
          <h1 className={`text-xl font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{view === 'dashboard' ? 'Centro de Control' : view === 'history' ? 'Historial de Viajes' : 'Gestión Maestra'}</h1>
          <div className="flex items-center gap-6">
            <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-black/5 hover:text-slate-900'}`}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-4 text-right">
                <div><p className="text-[10px] text-slate-500 font-bold">USUARIO ACTIVO</p><p className="text-xs font-bold text-blue-500">{currentUser?.full_name}</p></div>
                <img className="w-10 h-10 rounded-full border border-blue-500/50" src={`httpshttps://ui-avatars.com/api/?name=${currentUser?.full_name}&background=1d4ed8&color=fff`} alt="Avatar" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto z-0">
          {view === 'dashboard' && <DashboardMap />}
          {view === 'admin' && <AdminPanel currentUser={currentUser} theme={theme} />}
          {view === 'history' && <HistoryPanel user={currentUser} theme={theme} />}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, theme }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-widest ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-black/5 hover:text-slate-900'}`}>
    {React.cloneElement(icon, { size: 22 })}
    <span className="hidden lg:block">{label}</span>
  </button>
);

export default App;