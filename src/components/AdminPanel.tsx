import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Building2, ShieldCheck, Truck, AlertTriangle, Loader2, MapPin, X, Smartphone, Lock, Award, Download } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import VisorDeRuta from './VisorDeRuta'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Importamos solo lo necesario y evitamos conflictos de tipos
import type { Company, UserProfile, Trip, TripLog, Alert } from '../types';

interface AdminPanelProps {
  currentUser: UserProfile | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users' | 'history'>('overview');
  const [myCompanyName, setMyCompanyName] = useState<string>('');

  useEffect(() => {
    const fetchMyCompanyName = async () => {
        if (currentUser?.company_id) {
            const { data } = await supabase.from('companies').select('name').eq('id', currentUser.company_id).single();
            if (data) setMyCompanyName(data.name);
        }
    };
    fetchMyCompanyName();
  }, [currentUser]);
  
  if (!currentUser) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>;

  // 🔒 BLOQUEO DE SEGURIDAD
  // Convertimos el rol a string y minúsculas para evitar problemas de tipos
  const roleStr = (currentUser.role || '').toLowerCase() as string;
  
  if (roleStr === 'driver' || roleStr === 'conductor') {
      return (
          <div className="flex flex-col h-[80vh] items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-500">
              <div className="bg-blue-50 p-6 rounded-full mb-6">
                  <Smartphone className="w-16 h-16 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Web Restringido</h1>
              <p className="text-slate-500 max-w-md mb-8">
                  Hola <strong>{currentUser.full_name}</strong>. Tu cuenta tiene perfil de <strong>Conductor</strong>. 
                  <br/><br/>
                  Para registrar tus viajes, por favor utiliza la <strong>Aplicación Móvil MineConnect</strong>.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-4 py-2 rounded-lg">
                  <Lock className="w-3 h-3" />
                  Seguridad MineConnect SAT
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold text-on-surface-primary">
                {roleStr === 'super_admin' ? 'Panel Master (Super Admin)' : 'Gestión de Flota'}
            </h2>
            <p className="text-on-surface-secondary text-sm">
                {roleStr === 'super_admin'
                    ? 'Control Global: Empresas y Usuarios'
                    : `Empresa: ${myCompanyName || 'Cargando...'}` 
                }
            </p>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-on-surface-secondary">v3.7.0-SAT</span>
            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 Sistema Online
             </div>
         </div>
      </div>

      <div className="flex gap-4 border-b border-border-primary overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary hover:text-on-surface-primary'}`}>Resumen</button>
        {roleStr === 'super_admin' && (
            <button onClick={() => setActiveTab('companies')} className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'companies' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary hover:text-on-surface-primary'}`}>Empresas (Clientes)</button>
        )}
        <button onClick={() => setActiveTab('users')} className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary hover:text-on-surface-primary'}`}>{roleStr === 'super_admin' ? 'Usuarios y Roles' : 'Mis Conductores'}</button>
        <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-secondary hover:text-on-surface-primary'}`}>Historial de Viajes</button>
      </div>

      {activeTab === 'overview' && <OverviewStats role={roleStr} />}
      {activeTab === 'companies' && roleStr === 'super_admin' && <CompanyManager />}
      {activeTab === 'users' && <UserManager />}
      {activeTab === 'history' && <TripHistory companyId={currentUser.company_id} myCompanyName={myCompanyName} />}
    </div>
  );
};

// --- SUB COMPONENTES ---

const OverviewStats = ({ role }: { role: string }) => {
    const data = [{ name: 'Lun', active: 12 }, { name: 'Mar', active: 19 }, { name: 'Mie', active: 15 }, { name: 'Jue', active: 22 }, { name: 'Vie', active: 28 }, { name: 'Sab', active: 10 }, { name: 'Dom', active: 5 }];
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-primary"><div className="flex items-center gap-4"><div className="p-3 bg-primary/10 text-primary rounded-lg">{role === 'super_admin' ? <Building2 className="w-6 h-6" /> : <Truck className="w-6 h-6" />}</div><div><p className="text-sm text-on-surface-secondary">{role === 'super_admin' ? 'Empresas Activas' : 'Vehículos en Ruta'}</p><h3 className="text-2xl font-bold text-on-surface-primary">{role === 'super_admin' ? '2' : '1'}</h3></div></div></div>
                 <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-primary"><div className="flex items-center gap-4"><div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg"><Users className="w-6 h-6" /></div><div><p className="text-sm text-on-surface-secondary">Total Usuarios</p><h3 className="text-2xl font-bold text-on-surface-primary">4</h3></div></div></div>
                 <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-primary"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><ShieldCheck className="w-6 h-6" /></div><div><p className="text-sm text-on-surface-secondary">Estado del Servicio</p><h3 className="text-lg font-bold text-emerald-400">Conectado</h3></div></div></div>
            </div>
            <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-primary"><h3 className="text-lg font-bold text-on-surface-primary mb-6">Actividad Semanal</h3><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363D" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8B949E', fontSize: 12}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#8B949E', fontSize: 12}} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#21262D', color: '#C9D1D9' }} /><Bar dataKey="active" fill="#2F81F7" radius={[4, 4, 0, 0]} barSize={40} /></BarChart></ResponsiveContainer></div></div>
        </div>
    );
};

const CompanyManager = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [newCompany, setNewCompany] = useState('');
    const [loading, setLoading] = useState(false);
    const fetchCompanies = async () => { const { data } = await supabase.from('companies').select('*'); if (data) setCompanies(data); };
    const handleCreateCompany = async () => { if (!newCompany) return; setLoading(true); const { error } = await supabase.from('companies').insert({ name: newCompany, plan: 'pro' }); if (!error) { setNewCompany(''); fetchCompanies(); } else { console.error('Error creating company:', error.message); } setLoading(false); }
    useEffect(() => { fetchCompanies(); }, []);
    return (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary overflow-hidden">
             <div className="p-6 border-b border-border-primary bg-surface-secondary flex justify-between items-center"><h3 className="font-bold text-on-surface-primary flex items-center gap-2"><Building2 className="w-4 h-4" /> Empresas Clientes</h3><div className="flex gap-2"><input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Nombre Nueva Empresa" className="px-3 py-1.5 border border-border-secondary bg-surface-primary rounded text-sm outline-none focus:ring-2 focus:ring-primary text-on-surface-primary"/><button onClick={handleCreateCompany} disabled={loading} className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded text-sm flex items-center gap-2">{loading && <Loader2 className="w-3 h-3 animate-spin" />} Crear</button></div></div>
            <table className="w-full text-sm text-left"><thead className="text-xs text-on-surface-secondary uppercase bg-surface-secondary"><tr><th className="px-6 py-3">Nombre de Empresa</th><th className="px-6 py-3">Plan Activo</th></tr></thead><tbody>{companies.map((c) => (<tr key={c.id} className="border-b border-border-primary hover:bg-surface-secondary"><td className="px-6 py-4 font-bold text-on-surface-primary">{c.name}</td><td className="px-6 py-4"><span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full uppercase">{c.plan}</span></td></tr>))}</tbody></table>
        </div>
    );
};

const UserManager = () => {
    return (
        <div className="bg-surface-primary rounded-xl p-6 shadow-sm border border-border-primary">
            <h3 className="font-bold text-on-surface-primary mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> User Management
            </h3>
            <p className="text-on-surface-secondary">User management is not available in this version.</p>
        </div>
    );
}

const TripHistory = ({ companyId, myCompanyName }: { companyId: string | null, myCompanyName: string }) => {
    // Usamos los tipos correctos para el estado
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

    // Creamos un tipo para el resultado de la consulta, incluyendo los perfiles y empresas
    type TripWithProfile = Trip & {
        profiles: Partial<UserProfile> | null;
        companies: Partial<Company> | null;
    }

    useEffect(() => {
        const fetchTrips = async () => {
            setLoading(true);
            try {
                // CORRECCIÓN: Pedimos `full_name` en lugar de `first_name` y `last_name`
                let query = supabase.from('trips').select(`*, profiles (full_name, email), companies (name)`).order('created_at', { ascending: false });
                if (companyId) query = query.eq('company_id', companyId);
                const { data, error } = await query;
                if (error) throw error;
                // Forzamos el tipo correcto en la respuesta
                setTrips((data as TripWithProfile[]) || []);
            } catch (error: any) { console.error("Error cargando historial:", error.message); } finally { setLoading(false); }
        };
        fetchTrips();
    }, [companyId]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Reporte de Actividad de Flota', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);
        let companyHeader = 'Reporte Global (Super Admin)';
        if (companyId) companyHeader = `Empresa: ${myCompanyName}`; 
        doc.text(companyHeader, 14, 36);

        const tableColumn = ["Fecha", "Vehículo", "Conductor", "Duración", "Puntaje", "Estado"];
        const tableRows: (string | number)[][] = [];
        
        // CORRECCIÓN: Ahora `trip` tiene el tipo correcto
        trips.forEach(trip => {
            const tripData = trip as TripWithProfile;
            const date = new Date(trip.created_at).toLocaleDateString();
            // CORRECCIÓN: Usamos `full_name` que sí existe en el tipo.
            const driver = tripData.profiles?.full_name || tripData.profiles?.email || 'N/A';
            const duration = trip.duration_seconds ? `${Math.floor(trip.duration_seconds / 3600)}h ${Math.floor((trip.duration_seconds % 3600) / 60)}m` : '-';
            const score = Math.max(0, 100 - ((trip.alerts?.length || 0) * 10));
            const status = (trip.alerts?.length || 0) > 0 ? `${trip.alerts?.length || 0} Alertas` : 'OK';
            tableRows.push([date, trip.vehicle_id, driver, duration, `${score}/100`, status]);
        });
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45 });
        doc.save(`reporte_flota_${new Date().toISOString().slice(0,10)}.pdf`);
    };
    
    const TripDetailsModal = ({ trip, onClose }: { trip: TripWithProfile, onClose: () => void }) => {
        const [tripLogs, setTripLogs] = useState<TripLog[]>([]);
        const [loadingMap, setLoadingMap] = useState(true);

        useEffect(() => {
            const fetchGPSPoints = async () => {
                const { data } = await supabase.from('trip_logs').select('*').eq('trip_id', trip.id).order('timestamp', { ascending: true });
                if (data) setTripLogs(data || []);
                setLoadingMap(false);
            };
            fetchGPSPoints();
        }, [trip.id]);

        if (!trip) return null;
        
        // CORRECCIÓN: Lógica de nombre unificada y usando `full_name`.
        const driverName = trip.profiles?.full_name || trip.profiles?.email || 'Sin Asignar';
        const hasAlerts = (trip.alerts?.length || 0) > 0;
        const safetyScore = Math.max(0, 100 - ((trip.alerts || []).length * 10));
        let scoreColor = 'text-emerald-400'; 
        if (safetyScore < 90) scoreColor = 'text-yellow-400';
        if (safetyScore < 70) scoreColor = 'text-red-400';

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-surface-primary w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border-primary flex justify-between items-center bg-surface-secondary">
                        <div><h3 className="font-bold text-xl text-on-surface-primary flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Viaje: {trip.vehicle_id}</h3><p className="text-sm text-on-surface-secondary">Conductor: {driverName} • {new Date(trip.created_at).toLocaleString()}</p></div>
                        <button onClick={onClose} className="p-2 hover:bg-surface-secondary rounded-full transition-colors"><X className="w-6 h-6 text-on-surface-secondary" /></button>
                    </div>
                    <div className="flex-1 overflow-auto p-0 flex flex-col lg:flex-row h-full">
                        <div className="flex-1 bg-background min-h-[400px] relative border-r border-border-primary">
                            {loadingMap ? (
                                <div className="absolute inset-0 flex items-center justify-center text-on-surface-secondary gap-2"><Loader2 className="w-6 h-6 animate-spin" /> Cargando ruta GPS...</div>
                            ) : tripLogs.length > 0 ? (
                                <div className="w-full h-full"><VisorDeRuta logs={tripLogs} /></div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-secondary"><MapPin className="w-16 h-16 mb-4 text-on-surface-secondary/50" /><p>Sin datos GPS.</p></div>
                            )}
                        </div>
                        <div className="w-full lg:w-80 bg-surface-primary p-6 overflow-y-auto space-y-6">
                            <div className={`p-4 rounded-xl border flex items-center justify-between ${safetyScore >= 90 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-surface-secondary border-border-secondary'}`}>
                                <div><p className="text-xs font-bold text-on-surface-secondary uppercase flex items-center gap-1"><Award className="w-3 h-3" /> Calificación</p><p className={`text-3xl font-black ${scoreColor}`}>{safetyScore}<span className="text-sm text-on-surface-secondary font-normal">/100</span></p></div>
                                <div className="text-right"><span className="text-xs font-medium px-2 py-1 rounded bg-surface-secondary border border-border-secondary shadow-sm">{safetyScore >= 90 ? 'Excelente' : safetyScore >= 70 ? 'Aceptable' : 'Riesgoso'}</span></div>
                            </div>
                            {hasAlerts ? (<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"><h4 className="font-bold text-red-300 flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> Alertas ({(trip.alerts || []).length})</h4><ul className="space-y-2">{(trip.alerts || []).map((alert: Alert, idx: number) => (<li key={idx} className="text-sm text-red-400 flex gap-2"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5"></span>{alert.message || 'Evento de seguridad'}</li>))}</ul></div>) : (<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 flex items-center gap-2 text-sm font-medium"><ShieldCheck className="w-5 h-5" /> Sin infracciones</div>)}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 bg-surface-secondary rounded-lg border border-border-secondary flex justify-between items-center"><span className="text-xs text-on-surface-secondary">Velocidad Máx</span><span className="text-lg font-bold text-on-surface-primary">{trip.max_speed || 0} km/h</span></div>
                                <div className="p-3 bg-surface-secondary rounded-lg border border-border-secondary flex justify-between items-center"><span className="text-xs text-on-surface-secondary">Distancia</span><span className="text-lg font-bold text-on-surface-primary">{((trip.distance_meters || 0) / 1000).toFixed(1)} km</span></div>
                                <div className="p-3 bg-surface-secondary rounded-lg border border-border-secondary flex justify-between items-center"><span className="text-xs text-on-surface-secondary">Duración</span><span className="text-lg font-bold text-on-surface-primary">{Math.floor((trip.duration_seconds || 0) / 3600)}h {Math.floor(((trip.duration_seconds || 0) % 3600) / 60)}m</span></div>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-border-primary">
                                <div className="relative pl-6 border-l-2 border-border-secondary ml-2"><div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary rounded-full border-4 border-surface-primary shadow-sm"></div><p className="text-xs text-on-surface-secondary uppercase font-bold mb-1">Origen</p><p className="text-sm text-on-surface-primary">{trip.start_address || 'Dirección no registrada'}</p></div>
                                <div className="relative pl-6 border-l-2 border-border-secondary ml-2 pb-2"><div className="absolute -left-[9px] top-0 w-4 h-4 bg-on-surface-primary rounded-full border-4 border-surface-primary shadow-sm"></div><p className="text-xs text-on-surface-secondary uppercase font-bold mb-1">Destino</p><p className="text-sm text-on-surface-primary">{trip.end_address || trip.address || 'En ruta...'}</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary overflow-hidden relative">
             <div className="p-6 border-b border-border-primary bg-surface-primary z-10 relative flex justify-between items-center">
                <div><h3 className="font-bold text-on-surface-primary">Historial de Rutas (Tiempo Real)</h3><p className="text-xs text-on-surface-secondary mt-1">Haga clic en un viaje para ver el mapa y detalles.</p></div>
                <button onClick={handleExportPDF} className="flex items-center gap-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg transition-colors"><Download className="w-4 h-4" /> Descargar Reporte PDF</button>
            </div>
             <table className="w-full text-sm text-left"><thead className="text-xs text-on-surface-secondary uppercase bg-surface-secondary"><tr><th className="px-6 py-3">Fecha</th><th className="px-6 py-3">Vehículo</th><th className="px-6 py-3">Conductor</th><th className="px-6 py-3">Duración</th><th className="px-6 py-3">Estado</th></tr></thead><tbody>{loading && (<tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-secondary"><div className="flex flex-col items-center justify-center gap-3"><Loader2 className="w-6 h-6 animate-spin text-primary" /> <span>Cargando datos...</span></div></td></tr>)}{!loading && trips.length === 0 && (<tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-secondary">No hay viajes recientes.</td></tr>)}{trips.map((trip) => { const tripWithProfile = trip as TripWithProfile; const hasAlerts = (trip.alerts?.length || 0) > 0; const driverName = tripWithProfile.profiles?.full_name || tripWithProfile.profiles?.email || 'Sin Asignar'; const date = new Date(trip.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); const duration = trip.duration_seconds ? `${Math.floor(trip.duration_seconds / 3600)}h ${Math.floor((trip.duration_seconds % 3600) / 60)}m` : '-'; return (<tr key={trip.id} onClick={() => setSelectedTrip(trip)} className="border-b border-border-primary hover:bg-surface-secondary transition-colors cursor-pointer group"><td className="px-6 py-4 whitespace-nowrap text-on-surface-secondary group-hover:text-primary font-medium">{date}</td><td className="px-6 py-4 font-bold text-on-surface-primary">{trip.vehicle_id}</td><td className="px-6 py-4 flex items-center gap-2 text-on-surface-primary"><div className="w-6 h-6 bg-surface-secondary rounded-full flex items-center justify-center text-xs font-bold text-on-surface-secondary">{driverName.charAt(0)}</div>{driverName}</td><td className="px-6 py-4 font-mono text-xs text-on-surface-secondary">{duration}</td><td className="px-6 py-4">{hasAlerts ? (<span className="text-red-400 font-bold text-xs flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-full">{(trip.alerts?.length || 0)} Alertas</span>) : (<span className="text-emerald-400 font-bold text-xs flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full">OK</span>)}</td></tr>);})}</tbody></table>
            {selectedTrip && <TripDetailsModal trip={selectedTrip as TripWithProfile} onClose={() => setSelectedTrip(null)} />}
        </div>
    )
}

export default AdminPanel;