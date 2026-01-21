import { useState, useEffect } from 'react';
import { Users, Building2, ShieldCheck, Activity, Loader2, Plus, Zap, BarChart3 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const AdminPanel = ({ currentUser, theme }: { currentUser: any, theme: 'dark' | 'light' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users'>('overview');
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Forzamos el rol a minúsculas para evitar errores
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

  const bgColor = theme === 'dark' ? 'bg-transparent' : 'bg-transparent';
  const textColor = theme === 'dark' ? 'text-slate-300' : 'text-slate-800';
  const cardBg = theme === 'dark' ? 'bg-slate-900/40' : 'bg-slate-100/80';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';

  return (
    <div className={`h-full p-8 overflow-y-auto custom-scrollbar ${bgColor} ${textColor}`}>
      {/* Header del Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className={`text-4xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Administración</h2>
          <p className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Zap className="w-3 h-3 fill-current" /> 
            {role === 'super_admin' ? 'Control Maestro Global' : `Gestión Corporativa`}
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex p-1.5 rounded-2xl border ${borderColor} ${theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-200/50'} backdrop-blur-md`}>
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
            
            <div className={`${cardBg} border ${borderColor} rounded-[2.5rem] p-8 backdrop-blur-xl`}>
              <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mb-6 flex items-center gap-3`}>
                <Activity className="text-blue-500" /> ACTIVIDAD DEL SISTEMA
              </h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex items-center justify-between py-4 border-b ${borderColor} group ${theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'} transition-all px-4 rounded-xl`}>
                    <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Sincronización de flota para <b className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Transporte Andino</b></span>
                    <span className="text-[10px] font-mono text-blue-500/50 uppercase font-bold">Hace {i * 5} min</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && role === 'super_admin' && (
          <div className={`${cardBg} border ${borderColor} rounded-[2.5rem] overflow-hidden backdrop-blur-xl`}>
            <div className={`p-8 border-b ${borderColor} flex justify-between items-center ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-black/[0.01]'}`}>
              <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'} uppercase tracking-tight`}>Directorio de Empresas</h3>
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2">
                <Plus size={16} /> NUEVA EMPRESA
              </button>
            </div>
            <table className="w-full text-left">
              <thead className={`text-[10px] ${theme === 'dark' ? 'text-slate-500 bg-black/20' : 'text-slate-600 bg-black/5'} uppercase font-black tracking-[0.2em]`}>
                <tr>
                  <th className="px-8 py-5">Nombre Corporativo</th>
                  <th className="px-8 py-5">Plan</th>
                  <th className="px-8 py-5">Estado</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-200'}`}>
                {loading ? (
                  <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : companies.map(c => (
                  <tr key={c.id} className={`${theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'} transition-colors`}>
                    <td className={`px-8 py-6 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>{c.name}</td>
                    <td className="px-8 py-6"><span className="text-blue-500 dark:text-blue-400 text-xs font-mono">{c.plan || 'PRO'}</span></td>
                    <td className="px-8 py-6"><span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black border border-green-500/20">ACTIVO</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={`flex flex-col items-center justify-center p-20 ${cardBg} border ${borderColor} rounded-[3rem]`}>
            <Users className={`w-16 h-16 ${theme === 'dark' ? 'text-slate-800' : 'text-slate-400'} mb-4`} />
            <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mb-2`}>GESTIÓN DE USUARIOS</h3>
            <p className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'} text-sm`}>Este módulo está en desarrollo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TabBtn = ({ theme, active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]' 
        : `${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'}`
    }`}
  >
    {icon} {label}
  </button>
);

const StatCard = ({ theme, label, value, icon }: any) => (
  <div className={`${theme === 'dark' ? 'bg-slate-900/60' : 'bg-white/60'} border ${theme === 'dark' ? 'border-white/5 hover:border-blue-500/30' : 'border-slate-200/80 hover:border-blue-500/50'} p-8 rounded-[2.5rem] relative overflow-hidden group transition-all`}>
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} rounded-2xl text-blue-500`}>{icon}</div>
      <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'} uppercase tracking-widest`}>{label}</p>
    </div>
    <p className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tighter`}>{value}</p>
  </div>
);

export default AdminPanel;