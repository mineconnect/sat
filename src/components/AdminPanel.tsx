import { useState, useEffect } from 'react';
import { Users, Building2, ShieldCheck, Activity, Loader2, Plus, Zap, BarChart3 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const AdminPanel = ({ currentUser }: any) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users'>('overview');
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Forzamos el rol a minúsculas para evitar errores
  const role = (currentUser?.role || '').toLowerCase();

  useEffect(() => {
    if (activeTab === 'companies') fetchCompanies();
  }, [activeTab]);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data } = await supabase.from('companies').select('*');
    if (data) setCompanies(data);
    setLoading(false);
  };

  return (
    <div className="h-full bg-[#05070a] text-slate-200 p-8 overflow-y-auto custom-scrollbar">
      {/* Header del Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Administración</h2>
          <p className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Zap className="w-3 h-3 fill-current" /> 
            {role === 'super_admin' ? 'Control Maestro Global' : `Gestión Corporativa`}
          </p>
        </div>

        {/* Tabs Estilo Glassmorphism */}
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
          <TabBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={14}/>} label="Resumen" />
          {role === 'super_admin' && (
            <TabBtn active={activeTab === 'companies'} onClick={() => setActiveTab('companies')} icon={<Building2 size={14}/>} label="Empresas" />
          )}
          <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={14}/>} label="Usuarios" />
        </div>
      </div>

      {/* Contenido Dinámico */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Empresas Activas" value="12" icon={<Building2 />} color="blue" />
              <StatCard label="Usuarios en Red" value="48" icon={<Users />} color="purple" />
              <StatCard label="Estado del Servidor" value="ONLINE" icon={<ShieldCheck />} color="green" />
            </div>
            
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <Activity className="text-blue-500" /> ACTIVIDAD DEL SISTEMA
              </h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 group hover:bg-white/[0.02] transition-all px-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Sincronización de flota completada para <b className="text-white">Transporte Norte</b></span>
                    <span className="text-[10px] font-mono text-blue-500/50 uppercase font-bold">Hace {i * 5} min</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-black text-white uppercase tracking-tight">Directorio de Empresas</h3>
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2">
                <Plus size={16} /> NUEVA EMPRESA
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] bg-black/20">
                <tr>
                  <th className="px-8 py-5">Nombre Corporativo</th>
                  <th className="px-8 py-5">Plan</th>
                  <th className="px-8 py-5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : companies.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6 font-bold text-white uppercase tracking-tight">{c.name}</td>
                    <td className="px-8 py-6"><span className="text-blue-400 text-xs font-mono">{c.plan || 'PRO'}</span></td>
                    <td className="px-8 py-6"><span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black border border-green-500/20">ACTIVO</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex flex-col items-center justify-center p-20 bg-slate-900/40 border border-white/5 rounded-[3rem]">
            <Users className="w-16 h-16 text-slate-800 mb-4" />
            <h3 className="text-xl font-black text-white mb-2">GESTIÓN DE USUARIOS</h3>
            <p className="text-slate-500 text-sm">Este módulo está siendo optimizado para la v3.8</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componentes Auxiliares
const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
      active ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 hover:text-white'
    }`}
  >
    {icon} {label}
  </button>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-slate-900/60 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all">
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/10 blur-[50px] rounded-full group-hover:bg-${color}-500/20 transition-all`}></div>
    <div className="flex items-center gap-4 mb-4">
      <div className="p-3 bg-white/5 rounded-2xl text-blue-500">{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
  </div>
);

export default AdminPanel;