import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Search, Truck, Clock, Gauge, Award, Download, ChevronRight, ShieldCheck, Activity, History as HistoryIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'leaflet/dist/leaflet.css';

const ThemedMapLayer = ({ theme }: { theme: 'dark' | 'light' }) => {
  const darkUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const lightUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  
  return <TileLayer url={theme === 'dark' ? darkUrl : lightUrl} />;
};


const RecenterMap = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50], duration: 1 });
    }
  }, [points, map]);
  return null;
};

const HistoryPanel = ({ user, theme }: { user: any, theme: 'dark' | 'light' }) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [routeLogs, setRouteLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    setLoading(true);
    let query = supabase.from('trips').select('*').order('last_update', { ascending: false });
    if (user.role !== 'super_admin') {
      query = query.eq('company_id', user.company_id);
    }
    const { data, error } = await query;
    if (error) console.error("Error fetching trips:", error);
    setTrips(data || []);
    setLoading(false);
  };

  const loadTripDetails = async (trip: any) => {
    if (selectedTrip?.id === trip.id) {
        setSelectedTrip(null);
        setRouteLogs([]);
        return;
    }
    setSelectedTrip(trip);
    setRouteLogs([]);
    const { data } = await supabase.from('trip_logs').select('*').eq('trip_id', trip.id).order('created_at', { ascending: true });
    setRouteLogs(data || []);
  };

  const exportPDF = () => {
    if (!selectedTrip) return;
    const doc = new jsPDF();
    doc.text(`Reporte de Viaje - Patente ${selectedTrip?.plate}`, 14, 20);
    autoTable(doc, {
      head: [['Hora', 'Velocidad (km/h)', 'Latitud', 'Longitud']],
      body: routeLogs.map(l => [new Date(l.created_at).toLocaleTimeString(), l.speed, l.lat.toFixed(5), l.lng.toFixed(5)]),
      startY: 30
    });
    doc.save(`Viaje_${selectedTrip?.plate}_${new Date().toLocaleDateString()}.pdf`);
  };

  const filteredTrips = trips.filter(t => (t.plate || '').toUpperCase().includes(search.toUpperCase()));
  const cardBg = theme === 'dark' ? 'bg-slate-900/80' : 'bg-slate-100';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <div className="flex h-full gap-6 p-6 overflow-hidden">
      <div className="w-96 flex flex-col gap-4">
        <div className="relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-blue-500 transition-colors`} size={18} />
          <input 
            type="text" placeholder="BUSCAR PATENTE..." 
            className={`w-full ${cardBg} border ${borderColor} rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500 transition-all ${textColor} font-bold`}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {loading ? (
            <div className={`flex flex-col items-center justify-center h-full ${theme === 'dark' ? 'text-slate-600' : 'text-slate-500'}`}><Activity className="animate-spin mb-2" /> Cargando Viajes...</div>
          ) : filteredTrips.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center text-center p-4 ${cardBg} rounded-2xl`}>
                <HistoryIcon className={`w-12 h-12 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-400'} mb-4`} />
                <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>No hay registros de viajes</h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mt-1`}>Inicia un viaje de prueba en el simulador.</p>
            </div>
          ) : filteredTrips.map((trip) => (
            <div 
              key={trip.id}
              onClick={() => loadTripDetails(trip)}
              className={`p-5 rounded-[1.25rem] border transition-all cursor-pointer group relative overflow-hidden ${
                selectedTrip?.id === trip.id 
                ? 'bg-blue-600 border-blue-500 shadow-[0_10px_30px_rgba(37,99,235,0.3)] text-white' 
                : `${cardBg} ${borderColor} ${theme === 'dark' ? 'hover:border-white/20' : 'hover:border-slate-300'}`
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase ${selectedTrip?.id === trip.id ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                  {trip.plate || 'MÓVIL'}
                </span>
                <span className={`text-[10px] font-bold ${selectedTrip?.id === trip.id ? 'text-blue-100' : (theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}`}>
                  {new Date(trip.last_update).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${selectedTrip?.id === trip.id ? 'bg-blue-500' : (theme === 'dark' ? 'bg-white/5' : 'bg-slate-200')}`}>
                  <Truck size={20} className={selectedTrip?.id === trip.id ? 'text-white' : 'text-blue-500'} />
                </div>
                <div>
                   <p className={`text-xs font-black uppercase ${selectedTrip?.id === trip.id ? 'text-white' : (theme === 'dark' ? 'text-slate-300' : 'text-slate-700')}`}>Viaje Finalizado</p>
                   <p className={`text-[10px] flex items-center gap-1 ${selectedTrip?.id === trip.id ? 'text-blue-200' : (theme === 'dark' ? 'text-slate-500' : 'text-slate-500')}`}>
                      <Clock size={10} /> {new Date(trip.last_update).toLocaleTimeString()}
                   </p>
                </div>
                <ChevronRight className={`ml-auto transition-colors ${selectedTrip?.id === trip.id ? 'text-white' : `${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} group-hover:text-blue-500`}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className={`${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-200'} rounded-[2rem] border ${borderColor} overflow-hidden relative shadow-inner ${theme === 'dark' ? 'shadow-none' : ''}`}>
          {!selectedTrip ? (
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${theme === 'dark' ? 'text-slate-700' : 'text-slate-500'}`}>
              <div className={`p-8 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-300/50'} rounded-full mb-4 ring-1 ${theme === 'dark' ? 'ring-white/5' : 'ring-black/5'}`}>
                <Truck size={40} className="opacity-40" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Selecciona un recorrido del historial</p>
            </div>
          ) : (
            <MapContainer key={theme} center={[-34.6, -58.4]} zoom={12} className="h-full w-full" zoomControl={false}>
              <ThemedMapLayer theme={theme} />
              {routeLogs.length > 1 && (
                <>
                  <Polyline positions={routeLogs.map(l => [l.lat, l.lng])} pathOptions={{ color: '#2563eb', weight: 6, lineCap: 'round', opacity: 0.8 }} />
                  <RecenterMap points={routeLogs.map(l => [l.lat, l.lng])} />
                  <CircleMarker center={routeLogs[0]} radius={8} pathOptions={{ fillColor: '#10b981', color: 'white', weight: 3, fillOpacity: 1 }}><Tooltip>Inicio</Tooltip></CircleMarker>
                  <CircleMarker center={routeLogs[routeLogs.length - 1]} radius={8} pathOptions={{ fillColor: '#ef4444', color: 'white', weight: 3, fillOpacity: 1 }}><Tooltip>Fin</Tooltip></CircleMarker>
                </>
              )}
            </MapContainer>
          )}
        </div>

        {selectedTrip && (
          <div className={`${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-200'} border ${borderColor} rounded-[1.75rem] p-6 flex items-center justify-between animate-in slide-in-from-bottom-6`}>
            <div className="flex gap-8">
              <InfoCard theme={theme} icon={<Award className="text-yellow-500" />} label="Puntaje" value="98/100" />
              <InfoCard theme={theme} icon={<Gauge className="text-blue-500" />} label="Vel. Máx" value={`${selectedTrip.last_speed || 0} km/h`} />
              <InfoCard theme={theme} icon={<ShieldCheck className="text-green-500" />} label="Estado" value="SEGURO" />
            </div>
            <button onClick={exportPDF} disabled={routeLogs.length === 0} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-blue-700 transition-all flex items-center gap-3 disabled:bg-slate-500 disabled:cursor-not-allowed">
              <Download size={18} /> EXPORTAR PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ theme, icon, label, value }: any) => (
  <div className={`flex items-center gap-4 px-6 border-r ${theme === 'dark' ? 'border-white/5' : 'border-slate-300'} first:pl-0 last:border-none`}>
    <div className={`p-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-300/50'} rounded-2xl`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase">{label}</p>
      <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </div>
  </div>
);

export default HistoryPanel;