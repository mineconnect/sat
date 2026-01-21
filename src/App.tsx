import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, LogOut, Globe, Shield, Smartphone, History, Activity } from 'lucide-react';
import DashboardMap from './components/DashboardMap';
import AdminPanel from './components/AdminPanel';
import HistoryPanel from './components/HistoryPanel'; 
import Login from './components/Login';
import type { UserProfile } from './types';
import { saveLocationUpdate, supabase } from './services/supabaseClient';

// --- SIMULADOR APP CONDUCTOR (ESTÉTICA BLUE-PREMIUM) ---
const DriverSimulator = ({ onClose, user }: { onClose: () => void, user: UserProfile }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [plate, setPlate] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  
  // Referencia para limpiar el intervalo correctamente
  const intervalRef = useRef<any>(null);

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setPlate(value);
  };

  const toggleTracking = () => {
    if (isTracking) {
      // DETENER VIAJE
      setIsTracking(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLogs(p => ["🛑 Viaje finalizado con éxito.", "📡 GPS Desconectado.", ...p]);
      setCurrentTripId(null);
    } else {
      // INICIAR VIAJE
      if (plate.length < 6) {
        alert("⚠️ Ingrese una patente válida (Ej: AE123BK)");
        return;
      }
      const newTripId = `TRIP-${plate}-${Date.now()}`;
      setCurrentTripId(newTripId);
      setIsTracking(true);
      setLogs(p => ["🚀 Buscando Satélites...", `✅ Vehículo vinculado: ${plate}`, ...p]);
    }
  };

  useEffect(() => {
    if (isTracking && currentTripId) {
      intervalRef.current = setInterval(() => {
        const lat = -34.6037 + (Math.random() - 0.5) * 0.01;
        const lng = -58.3816 + (Math.random() - 0.5) * 0.01;
        const speed = Math.floor(Math.random() * 90);
        
        saveLocationUpdate(currentTripId, lat, lng, speed, plate, user.company_id || undefined);
        
        setLogs(p => [
          `📍 ${new Date().toLocaleTimeString()} | ${speed}km/h | Sincronizado`,
          ...p.slice(0, 5)
        ]);
      }, 5000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTracking, currentTripId, plate, user.company_id]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-blue-950 border border-blue-500/30 w-full max-w-sm rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(37,99,235,0.2)] relative h-[720px] flex flex-col border-t-blue-400/50">
        
        {/* iPhone-style Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-10"></div>
        
        <div className="flex-1 p-8 flex flex-col items-center pt-14">
          <div className="bg-blue-500/20 p-4 rounded-full mb-4 ring-2 ring-blue-500/50">
            <Smartphone className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tighter mb-2">MineConnect <span className="text-blue-400">CONDUCTOR</span></h2>
          <p className="text-blue-300/60 text-[10px] font-bold uppercase tracking-widest mb-8">Unidad de Seguimiento v3.0</p>
          
          <div className="w-full space-y-3 mb-10">
            <div className="flex justify-between items-center px-2">
               <label className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Patente del Móvil</label>
               <Activity className={`w-3 h-3 ${isTracking ? 'text-green-400 animate-pulse' : 'text-slate-600'}`} />
            </div>
            <input 
              type="text"
              value={plate}
              onChange={handlePlateChange}
              disabled={isTracking}
              placeholder="AE-123-BK"
              className="w-full bg-slate-950 border-2 border-blue-500/20 rounded-2xl py-5 text-center text-3xl font-mono font-bold text-white placeholder:text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <button
             onClick={toggleTracking}
             className={`w-48 h-48 rounded-full border-[6px] flex items-center justify-center transition-all transform active:scale-90 relative group ${
               isTracking 
                ? 'border-red-500/50 bg-red-950/30 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)]' 
                : 'border-blue-500/50 bg-blue-950/30 text-blue-400 shadow-[0_0_50px_rgba(37,99,235,0.2)]'
             }`}
          >
            <div className="text-center">
              <span className="block text-xl font-black leading-tight">
                {isTracking ? 'DETENER' : 'INICIAR'}
              </span>
              <span className="block text-[10px] font-bold opacity-70">VIAJE</span>
            </div>
            {/* Animación de pulso si está activo */}
            {isTracking && <div className="absolute inset-0 rounded-full animate-ping border-2 border-red-500 opacity-20"></div>}
          </button>

          <div className="w-full mt-10 bg-black/40 backdrop-blur-md rounded-2xl p-4 h-36 overflow-hidden font-mono text-[10px] text-blue-300/80 border border-blue-500/10">
            <div className="text-blue-500 font-bold mb-2 border-b border-blue-500/20 pb-1">CONSOLE LOGS:</div>
            {logs.map((l, i) => <div key={i} className="py-0.5 border-b border-white/5 truncate">{l}</div>)}
          </div>
        </div>

        <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white py-6 transition-all font-black uppercase tracking-widest text-xs shadow-[0_-10px_30px_rgba(37,99,235,0.2)]">
          Cerrar Simulación
        </button>
      </div>
    </div>
  );
};

// --- PANEL PRINCIPAL ---
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'dashboard' | 'admin' | 'history'>('dashboard');
  const [showSimulator, setShowSimulator] = useState(false);

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

      {/* Sidebar Lateral Pro */}
      <aside className="w-20 lg:w-72 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-50">
        <div className="p-8 flex items-center gap-3 h-20 bg-slate-900/30">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.4)] ring-2 ring-white/10">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter hidden lg:block text-white">MINE<span className="text-blue-500">SAT</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-10">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard />} label="Centro de Control" />
          <NavItem active={view === 'history'} onClick={() => setView('history')} icon={<History />} label="Historial de Viajes" />
          <NavItem active={view === 'admin'} onClick={() => setView('admin')} icon={<Shield />} label={currentUser?.role === 'super_admin' ? 'Administración' : 'Gestión de Empresa'} />
          
          <div className="pt-10">
            <button
              onClick={() => setShowSimulator(true)}
              className="w-full group flex items-center gap-4 px-5 py-5 rounded-2xl font-black transition-all text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40"
            >
              <Smartphone className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span className="hidden lg:block uppercase tracking-wider text-xs">App Conductor</span>
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 bg-slate-950/50">
          <div className="mb-6 px-2 hidden lg:block">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Usuario Activo</p>
              <p className="text-sm font-bold text-white truncate">{currentUser?.full_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{currentUser?.role.replace('_', ' ')}</p>
              </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-3 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all font-bold text-sm">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-full bg-[#080a0f] relative overflow-hidden">
        {/* Decorative ambient lights */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-900/10 blur-[120px] rounded-full"></div>

        <header className="h-20 bg-slate-900/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-10 z-10">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              {view === 'dashboard' && 'Monitor Satelital en Vivo'}
              {view === 'history' && 'Registros Históricos'}
              {view === 'admin' && 'Panel de Control Maestro'}
            </h1>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">MineConnect SAT v3.7.0</p>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] text-slate-600 font-bold uppercase">ID Corporativo</p>
                <p className="text-xs font-mono text-blue-500 font-bold">{currentUser?.company_id?.substring(0,13) || 'SÚPER-ADMIN-MC'}</p>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 p-[2px] shadow-lg shadow-blue-500/20">
                <img 
                  className="w-full h-full rounded-[14px] object-cover bg-slate-900"
                  src={`https://ui-avatars.com/api/?name=${currentUser?.full_name}&background=0f172a&color=3b82f6&bold=true`} 
                  alt="Avatar" 
                />
             </div>
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

// --- COMPONENTE AUXILIAR NAVBAR ---
const NavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all relative overflow-hidden group ${
      active 
        ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-xl shadow-blue-500/20' 
        : 'text-slate-500 hover:bg-white/5 hover:text-white'
    }`}
  >
    {React.cloneElement(icon, { size: 22, className: active ? 'text-white' : 'group-hover:text-blue-400 transition-colors' })}
    <span className="hidden lg:block text-xs uppercase tracking-widest">{label}</span>
    {active && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white"></div>}
  </button>
);

export default App;