import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, LogOut, Globe, Shield, Smartphone, Sun, Moon
} from 'lucide-react';
import DashboardMap from './components/DashboardMap';
import AdminPanel from './components/AdminPanel';
import HistoryPanel from './components/HistoryPanel'; 
import Login from './components/Login';
import type { UserProfile } from './types';
import DriverSimulator from './components/DriverSimulator';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [monitoringTab, setMonitoringTab] = useState<'map' | 'history'>('map');
  const [showSimulator, setShowSimulator] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    return savedTheme || 'dark';
  });

  // Recupera la sesión al cargar
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

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
    <div className={`flex h-screen font-sans overflow-hidden dark bg-background text-on-surface-secondary`}>
      {showSimulator && <DriverSimulator onClose={() => setShowSimulator(false)} user={currentUser} />}
      
      <aside className={`w-20 lg:w-72 flex flex-col z-50 transition-colors duration-300 bg-background border-r border-border-primary`}>
        <div className="p-8 flex items-center gap-3 h-20"><Globe className="w-8 h-8 text-blue-500" /><span className={`font-black text-2xl hidden lg:block text-on-surface-primary`}>MINE<span className="text-blue-500">SAT</span></span></div>
        <nav className="flex-1 px-4 space-y-3 mt-10">
          <NavItem theme={theme} active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard />} label="Monitoreo" />
          <NavItem theme={theme} active={view === 'admin'} onClick={() => setView('admin')} icon={<Shield />} label="Administración" />
          <button onClick={() => setShowSimulator(true)} className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl font-black text-primary mt-10 transition-colors bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:bg-primary/20`}><Smartphone className="w-6 h-6" /><span className="hidden lg:block text-xs uppercase tracking-widest">App Conductor</span></button>
        </nav>
        <div className={`p-6 border-t transition-colors border-border-primary`}>
          <button onClick={handleLogout} className={`w-full flex items-center gap-4 px-5 py-3 font-bold text-sm transition-all text-on-surface-secondary hover:text-on-surface-primary`}>
            <LogOut className="w-5 h-5" /><span className="hidden lg:block">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      
      <main className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors bg-background`}>
        <header className={`h-20 backdrop-blur-md border-b flex items-center justify-between px-10 z-10 transition-colors bg-surface-secondary/50 border-border-primary`}>
          <div className="flex items-center gap-6">
            <h1 className={`text-xl font-black uppercase text-on-surface-primary`}>{view === 'dashboard' ? 'Monitoreo' : 'Gestión Maestra'}</h1>
            {view === 'dashboard' && (
              <div className="flex items-center gap-2 rounded-lg p-1 transition-colors bg-surface-secondary/20">
                <TabButton theme={theme} active={monitoringTab === 'map'} onClick={() => setMonitoringTab('map')} label="Mapa en Vivo" />
                <TabButton theme={theme} active={monitoringTab === 'history'} onClick={() => setMonitoringTab('history')} label="Historial" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors text-on-surface-secondary hover:bg-surface-secondary/50 hover:text-on-surface-primary`}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-4 text-right">
                <div><p className="text-[10px] text-on-surface-secondary font-bold">USUARIO ACTIVO</p><p className="text-xs font-bold text-primary">{currentUser?.full_name}</p></div>
                <img className="w-10 h-10 rounded-full border border-blue-500/50" src={`https://ui-avatars.com/api/?name=${currentUser?.full_name}&background=1d4ed8&color=fff`} alt="Avatar" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto z-0">
          {view === 'dashboard' && monitoringTab === 'map' && <DashboardMap />}
          {view === 'dashboard' && monitoringTab === 'history' && <HistoryPanel user={currentUser} theme={theme} />}
          {view === 'admin' && <AdminPanel currentUser={currentUser} theme={theme} />}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, theme }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-widest ${active 
    ? 'bg-primary text-on-surface-primary shadow-lg shadow-primary/20' 
    : `${theme === 'dark' ? 'text-on-surface-secondary hover:bg-surface-secondary/50 hover:text-on-surface-primary' : 'text-on-surface-secondary hover:bg-surface-secondary/50 hover:text-on-surface-primary'}`
  }`}>
    {React.cloneElement(icon, { size: 22 })}
    <span className="hidden lg:block">{label}</span>
  </button>
);

const TabButton = ({ active, onClick, label, theme }: any) => (
  <button onClick={onClick} className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${active 
    ? 'bg-primary text-on-surface-primary' 
    : `${theme === 'dark' ? 'text-on-surface-secondary hover:bg-surface-secondary/50' : 'text-on-surface-secondary hover:bg-surface-secondary/50'}`
  }`}>
    {label}
  </button>
);

export default App;