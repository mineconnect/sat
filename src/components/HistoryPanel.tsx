import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Search, Truck, Clock, Gauge, Award, Download, ChevronRight, ShieldCheck, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'leaflet/dist/leaflet.css';

const RecenterMap = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) map.fitBounds(points, { padding: [50, 50] });
  }, [points, map]);
  return null;
};

const HistoryPanel = ({ user }: any) => {
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
    if (user.role !== 'super_admin') query = query.eq('company_id', user.company_id);
    const { data } = await query;
    setTrips(data || []);
    setLoading(false);
  };

  const loadTripDetails = async (trip: any) => {
    setSelectedTrip(trip);
    const { data } = await supabase.from('trip_logs').select('*').eq('trip_id', trip.id).order('created_at', { ascending: true });
    setRouteLogs(data || []);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Reporte de Viaje - ${selectedTrip?.plate}`, 14, 20);
    autoTable(doc, {
      head: [['Hora', 'Velocidad', 'Lat', 'Lng']],
      body: routeLogs.map(l => [new Date(l.created_at).toLocaleTimeString(), `${l.speed} km/h`, l.lat, l.lng]),
      startY: 30
    });
    doc.save(`Viaje_${selectedTrip?.plate}.pdf`);
  };

  return (
    <div className="flex h-full bg-[#05070a] gap-6 p-6 overflow-hidden">
      <div className="w-96 flex flex-col gap-4">
        <div className="relative group">
          <Search className="absolute left-4 top-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" placeholder="BUSCAR PATENTE..." 
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500 transition-all text-white font-bold"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600"><Activity className="animate-spin mb-2" /> Cargando...</div>
          ) : trips.filter(t => (t.plate||'').includes(search.toUpperCase())).map((trip) => (
            <div 
              key={trip.id}
              onClick={() => loadTripDetails(trip)}
              className={`p-5 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${
                selectedTrip?.id === trip.id ? 'bg-blue-600 border-blue-500 shadow-[0_10px_30px_rgba(37,99,235,0.3)]' : 'bg-slate-900/50 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase ${selectedTrip?.id === trip.id ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                  {trip.plate || 'MÓVIL'}
                </span>
                <span className={`text-[10px] font-bold ${selectedTrip?.id === trip.id ? 'text-blue-100' : 'text-slate-500'}`}>
                  {new Date(trip.last_update).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${selectedTrip?.id === trip.id ? 'bg-blue-500' : 'bg-white/5'}`}>
                  <Truck size={20} className={selectedTrip?.id === trip.id ? 'text-white' : 'text-blue-500'} />
                </div>
                <div>
                   <p className={`text-xs font-black uppercase ${selectedTrip?.id === trip.id ? 'text-white' : 'text-slate-300'}`}>Viaje Finalizado</p>
                   <p className={`text-[10px] flex items-center gap-1 ${selectedTrip?.id === trip.id ? 'text-blue-200' : 'text-slate-500'}`}>
                      <Clock size={10} /> {new Date(trip.last_update).toLocaleTimeString()}
                   </p>
                </div>
                <ChevronRight className={`ml-auto ${selectedTrip?.id === trip.id ? 'text-white' : 'text-slate-800'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 bg-slate-900 rounded-[3rem] border border-white/10 overflow-hidden relative shadow-2xl">
          {!selectedTrip ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
              <div className="p-8 bg-slate-950 rounded-full mb-4 ring-1 ring-white/5">
                <Truck size={40} className="opacity-20" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Seleccioná un recorrido</p>
            </div>
          ) : (
            <MapContainer center={[-34.6, -58.4]} zoom={12} className="h-full w-full" zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {routeLogs.length > 1 && (
                <>
                  <Polyline positions={routeLogs.map(l => [l.lat, l.lng])} pathOptions={{ color: '#2563eb', weight: 6, lineCap: 'round' }} />
                  <RecenterMap points={routeLogs.map(l => [l.lat, l.lng])} />
                  {routeLogs.filter((_, i) => i % 5 === 0).map((log, idx) => (
                    <CircleMarker key={idx} center={[log.lat, log.lng]} radius={5} pathOptions={{ fillColor: '#3b82f6', color: 'white', weight: 2, fillOpacity: 1 }}>
                      <Tooltip sticky><div className="bg-slate-900 text-white p-2 font-bold text-xs">⚡ {log.speed} km/h</div></Tooltip>
                    </CircleMarker>
                  ))}
                </>
              )}
            </MapContainer>
          )}
        </div>

        {selectedTrip && (
          <div className="h-32 bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 flex items-center justify-between animate-in slide-in-from-bottom-6">
            <div className="flex gap-8">
              <div className="flex items-center gap-4 px-6 border-r border-white/5">
                <div className="p-3 bg-white/5 rounded-2xl"><Award className="text-yellow-500" /></div>
                <div><p className="text-[10px] font-black text-slate-500 uppercase">Puntaje</p><p className="text-xl font-black text-white">98/100</p></div>
              </div>
              <div className="flex items-center gap-4 px-6 border-r border-white/5">
                <div className="p-3 bg-white/5 rounded-2xl"><Gauge className="text-blue-500" /></div>
                <div><p className="text-[10px] font-black text-slate-500 uppercase">Vel. Máx</p><p className="text-xl font-black text-white">{selectedTrip.last_speed || 0} km/h</p></div>
              </div>
              <div className="flex items-center gap-4 px-6 border-r border-white/5">
                <div className="p-3 bg-white/5 rounded-2xl"><ShieldCheck className="text-green-500" /></div>
                <div><p className="text-[10px] font-black text-slate-500 uppercase">Estado</p><p className="text-xl font-black text-white">OK</p></div>
              </div>
            </div>
            <button onClick={exportPDF} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xs hover:bg-blue-500 hover:text-white transition-all flex items-center gap-3">
              <Download size={18} /> EXPORTAR PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;