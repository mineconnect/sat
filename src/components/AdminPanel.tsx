import { useState, useEffect, type ReactNode } from 'react';
import { Users, Building2, ShieldCheck, Activity, Loader2, Plus, Zap, BarChart3 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const AdminPanel = ({ currentUser, theme }: { currentUser: any, theme: 'dark' | 'light' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users'>('overview');
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  
  const role = (currentUser?.role || '').toLowerCase();

  useEffect(() => {
    if (activeTab === 'companies' && role === 'super_admin') {
      fetchCompanies();
    }
  }, [activeTab, role]);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('*');
    if (data) setCompanies(data);
    if (error) console.error("Error fetching companies:", error);
    setLoading(false);
  };



  return (
    <div className={`h-full p-8 overflow-y-auto custom-scrollbar bg-background text-on-surface-primary`}>
      {/* Header del Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className={`text-4xl font-black tracking-tighter uppercase text-on-surface-primary`}>Administración</h2>
          <p className="text-primary font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Zap className="w-3 h-3 fill-current" /> 
            {role === 'super_admin' ? 'Control Maestro Global' : `Gestión Corporativa`}
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex p-1.5 rounded-2xl border border-border-primary bg-surface-secondary/20 backdrop-blur-md`}>
          <TabBtn theme={theme} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={14}/>} label="Resumen" />
          {role === 'super_admin' && (
            <TabBtn theme={theme} active={activeTab === 'companies'} onClick={() => setActiveTab('companies')} icon={<Building2 size={14}/>} label="Empresas" />
          )}
          <TabBtn theme={theme} active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={14}/>} label="Usuarios" />
        </div>
      </div>

      {/* Contenido Dinámico */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard theme={theme} label="Empresas Activas" value="12" icon={<Building2 />} />
              <StatCard theme={theme} label="Usuarios en Red" value="48" icon={<Users />} />
              <StatCard theme={theme} label="Estado del Servidor" value="ONLINE" icon={<ShieldCheck />} />
            </div>
            
            <div className={`bg-surface-primary border border-border-primary rounded-[2.5rem] p-8 backdrop-blur-xl`}>
              <h3 className={`text-xl font-black text-on-surface-primary mb-6 flex items-center gap-3`}>
                <Activity className="text-primary" /> ACTIVIDAD DEL SISTEMA
              </h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex items-center justify-between py-4 border-b border-border-primary group hover:bg-surface-secondary/50 transition-all px-4 rounded-xl`}>
                    <span className={`text-on-surface-secondary text-sm`}>Sincronización de flota para <b className={`text-on-surface-primary`}>Transporte Andino</b></span>
                    <span className="text-[10px] font-mono text-primary/50 uppercase font-bold">Hace {i * 5} min</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && role === 'super_admin' && (
          <div className={`bg-surface-primary border border-border-primary rounded-[2.5rem] overflow-hidden backdrop-blur-xl`}>
            <div className={`p-8 border-b border-border-primary flex justify-between items-center bg-surface-secondary/20`}>
              <h3 className={`font-black text-on-surface-primary uppercase tracking-tight`}>Directorio de Empresas</h3>
              <button className="bg-primary hover:bg-primary-hover text-on-surface-primary px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2">
                <Plus size={16} /> NUEVA EMPRESA
              </button>
            </div>
            <table className="w-full text-left">
              <thead className={`text-[10px] text-on-surface-secondary bg-surface-secondary/20 uppercase font-black tracking-[0.2em]`}>
                <tr>
                  <th className="px-8 py-5">Nombre Corporativo</th>
                  <th className="px-8 py-5">Plan</th>
                  <th className="px-8 py-5">Estado</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-border-primary`}>
                {loading ? (
                  <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
                ) : companies.map(c => (
                  <tr key={c.id} className={`hover:bg-surface-secondary/50 transition-colors`}>
                    <td className={`px-8 py-6 font-bold text-on-surface-primary uppercase tracking-tight`}>{c.name}</td>
                    <td className="px-8 py-6"><span className="text-primary dark:text-primary-hover text-xs font-mono">{c.plan || 'PRO'}</span></td>
                    <td className="px-8 py-6"><span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black border border-green-500/20">ACTIVO</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={`flex flex-col items-center justify-center p-20 bg-surface-primary border border-border-primary rounded-[3rem]`}>
            <Users className={`w-16 h-16 text-on-surface-secondary opacity-40 mb-4`} />
            <h3 className={`text-xl font-black text-on-surface-primary mb-2`}>GESTIÓN DE USUARIOS</h3>
            <p className={`text-on-surface-secondary text-sm`}>Este módulo está en desarrollo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface TabBtnProps {
  theme: 'dark' | 'light';
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

const TabBtn = ({ theme, active, onClick, icon, label }: TabBtnProps) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
      active 
        ? 'bg-primary text-on-surface-primary shadow-lg shadow-primary/30' 
        : `text-on-surface-secondary hover:text-on-surface-primary ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`
    }`}
  >
    {icon} {label}
  </button>
);

interface StatCardProps {
  theme: 'dark' | 'light';
  label: string;
  value: string | number;
  icon: ReactNode;
}

const StatCard = ({ theme, label, value, icon }: StatCardProps) => (
  <div className={`bg-surface-secondary/50 border p-8 rounded-[2.5rem] relative overflow-hidden group transition-all hover:border-primary/50 ${theme === 'dark' ? 'border-white/10' : 'shadow-sm'}`}>
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 bg-surface-secondary/20 rounded-2xl text-blue-500`}>{icon}</div>
      <p className={`text-[10px] font-black text-on-surface-secondary uppercase tracking-widest`}>{label}</p>
    </div>
    <p className={`text-4xl font-black text-on-surface-primary tracking-tighter`}>{value}</p>
  </div>
);

export default AdminPanel;