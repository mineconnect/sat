import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Search, Truck, Clock, Gauge } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Componente para centrar el mapa automáticamente cuando cambia el viaje
const RecenterMap = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

const HistoryPanel = ({ user }: any) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [routeLogs, setRouteLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 1. Cargar lista de viajes (Filtrado por Empresa + Ordenado por Fecha)
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      let query = supabase
        .from('trips')
        .select('*')
        .order('start_time', { ascending: false });

      // Si no es super_admin, filtramos por su empresa
      if (user.role !== 'super_admin') {
        query = query.eq('company_id', user.company_id);
      }

      const { data } = await query;
      setTrips(data || []);
      setLoading(false);
    };
    fetchTrips();
  }, [user]);

  // 2. Cargar el detalle del viaje (Logs de 5 segundos)
  const loadTripDetails = async (trip: any) => {
    setSelectedTrip(trip);
    const { data } = await supabase
      .from('trip_logs')
      .select('*')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: true });
    
    setRouteLogs(data || []);
  };

  const filteredTrips = trips.filter(t => 
    t.plate?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full bg-[#0d0d0d] gap-4 p-6">
      {/* Lista Lateral de Viajes */}
      <div className="w-96 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar por patente..." 
            className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 outline-none"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-slate-600 animate-pulse">Cargando historial...</div>
          ) : filteredTrips.map((trip) => (
            <div 
              key={trip.id}
              onClick={() => loadTripDetails(trip)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedTrip?.id === trip.id ? 'bg-blue-600/10 border-blue-500' : 'bg-[#111] border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">
                  {trip.plate || 'SIN PATENTE'}
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {new Date(trip.start_time).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mb-1 truncate">ID: {trip.id}</p>
              <div className="flex items-center gap-3 text-slate-500">
                 <div className="flex items-center gap-1 text-[10px]">
                    <Clock className="w-3 h-3" /> {new Date(trip.start_time).toLocaleTimeString()}
                 </div>
                 {trip.status === 'completed' && <span className="text-[10px] text-green-500 font-bold uppercase">Finalizado</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa de Trazado de Ruta */}
      <div className="flex-1 bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl">
        {!selectedTrip ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 z-10">
            <Truck className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">Seleccioná un viaje para ver el recorrido</p>
          </div>
        ) : (
          <MapContainer 
            center={[-34.6037, -58.3816]} 
            zoom={13} 
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; MineConnect SAT'
            />
            
            {routeLogs.length > 1 && (
              <>
                <Polyline 
                  positions={routeLogs.map(l => [l.lat, l.lng])} 
                  pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8, lineJoin: 'round' }} 
                />
                <RecenterMap points={routeLogs.map(l => [l.lat, l.lng])} />
                
                {/* Marcadores de velocidad al pasar el mouse */}
                {routeLogs.map((log, idx) => (
                  <CircleMarker 
                    key={idx} 
                    center={[log.lat, log.lng]} 
                    radius={4}
                    pathOptions={{ fillColor: '#3b82f6', color: 'transparent', fillOpacity: 0.6 }}
                  >
                    <Tooltip sticky>
                      <div className="bg-slate-900 text-white p-2 rounded shadow-xl border border-blue-500">
                        <p className="flex items-center gap-2 font-bold"><Gauge className="w-3 h-3 text-blue-400"/> {log.speed} km/h</p>
                        <p className="text-[10px] opacity-70 mt-1">{new Date(log.created_at).toLocaleTimeString()}</p>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                ))}
              </>
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;