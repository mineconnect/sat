import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Search, Truck, Gauge, Award, Download, ChevronRight, ShieldCheck, Activity, History as HistoryIcon } from 'lucide-react';
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
    if (points.length > 0 && points.every(p => p[0] != null && p[1] != null && typeof p[0] === 'number' && typeof p[1] === 'number')) {
      map.fitBounds(points, { padding: [50, 50], duration: 1 });
    }
  }, [points, map]);
  return null;
};

const StopMarker = ({ position, time }: { position: [number, number], time: number }) => {
  return (
    <CircleMarker center={position} radius={8} pathOptions={{ fillColor: '#f97316', color: 'white', weight: 3, fillOpacity: 1 }}>
      <Tooltip>Parada: {Math.round(time / 60000)} min</Tooltip>
    </CircleMarker>
  );
};

const SpeedPolyline = ({ routeLogs }: { routeLogs: any[] }) => {
  return (
    <>
      {routeLogs.map((log, i) => {
        if (i === 0) return null;
        const prevLog = routeLogs[i - 1];
        return (
          <Polyline
            key={i}
            positions={[[prevLog.lat, prevLog.lng], [log.lat, log.lng]]}
            pathOptions={{ color: '#2563eb', weight: 6, lineCap: 'round', opacity: 0.8 }}
          >
            <Tooltip>Velocidad: {log.speed} km/h</Tooltip>
          </Polyline>
        );
      })}
    </>
  );
};

const HistoryPanel = ({ user, theme }: { user: any, theme: 'dark' | 'light' }) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [routeLogs, setRouteLogs] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTrips();
  }, [user]);

  useEffect(() => {
    if (routeLogs.length === 0) {
      setStops([]);
      return;
    }

    const detectedStops = [];
    let currentStop: any = null;

    for (const log of routeLogs) {
      if (log.speed === 0) {
        if (!currentStop) {
          currentStop = {
            lat: log.lat,
            lng: log.lng,
            startTime: new Date(log.created_at).getTime(),
            endTime: new Date(log.created_at).getTime(),
          };
        } else {
          currentStop.endTime = new Date(log.created_at).getTime();
        }
      } else {
        if (currentStop) {
          const duration = currentStop.endTime - currentStop.startTime;
          if (duration > 120000) {
            detectedStops.push({
              position: [currentStop.lat, currentStop.lng],
              time: duration,
            });
          }
          currentStop = null;
        }
      }
    }

    if (currentStop) {
      const duration = currentStop.endTime - currentStop.startTime;
      if (duration > 120000) {
        detectedStops.push({
          position: [currentStop.lat, currentStop.lng],
          time: duration,
        });
      }
    }

    setStops(detectedStops);
  }, [routeLogs]);

  const fetchTrips = async () => {
    setLoading(true);
    let query = supabase.from('trips').select('*').order('last_update', { ascending: false });
    if (user.role !== 'super_admin') {
      query = query.eq('company_id', user.company_id);
    }
    const { data, error } = await query;
    if (error) console.error("Error fetching trips:", error);
    console.log("Viajes recuperados:", data);
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
    if (!selectedTrip || routeLogs.length === 0) return;

    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
      title: `Reporte de Viaje - ${selectedTrip.plate}`,
      subject: `Detalles del Viaje para Patente ${selectedTrip.plate}`,
      author: 'MineConnect SAT',
    });

    // Header with simulated logo
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue color for MINE
    doc.text("MINE", 14, 20);
    doc.setTextColor(0, 0, 0); // Black color for SAT
    doc.text("SAT", 32, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Reporte de Seguimiento de Viaje", 14, 26);

    // Trip Information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Patente: ${selectedTrip.plate}`, 14, 40);
    doc.text(`ID de Viaje: ${selectedTrip.id}`, 14, 46);
    doc.text(`Última Actualización: ${new Date(selectedTrip.last_update).toLocaleString()}`, 14, 52);
    
    // Table for route logs
    autoTable(doc, {
      startY: 60,
      head: [['Hora', 'Latitud', 'Longitud', 'Velocidad (km/h)']],
      body: routeLogs.map(l => [
        new Date(l.created_at).toLocaleTimeString(), 
        l.lat.toFixed(5), 
        l.lng.toFixed(5), 
        l.speed
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [37, 99, 235], // Blue header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240] // Light gray for alternate rows
      },
      margin: { top: 10 },
    });

    doc.save(`Viaje_${selectedTrip.plate}_${new Date().toLocaleDateString()}.pdf`);
  };

  const formatDuration = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  };

  const filteredTrips = trips.filter((trip: any) => (trip.plate || '').toUpperCase().includes(search.toUpperCase()));

  return (
    <div className="flex h-full gap-6 p-6 overflow-hidden">
      <div className="w-96 flex flex-col gap-4">
        <div className="relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-secondary group-focus-within:text-primary transition-colors`} size={18} />
          <input 
            type="text" placeholder="BUSCAR PATENTE..." 
            className={`w-full bg-surface-primary border border-border-primary rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-primary transition-all text-on-surface-primary font-bold`}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {loading ? (
            <div className={`flex flex-col items-center justify-center h-full text-on-surface-secondary`}><Activity className="animate-spin mb-2" /> Cargando Viajes...</div>
          ) : filteredTrips.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center text-center p-4 bg-surface-primary rounded-2xl`}>
                <HistoryIcon className={`w-12 h-12 text-on-surface-secondary mb-4`} />
                <h3 className={`font-bold text-on-surface-primary`}>No hay registros de viajes</h3>
                <p className={`text-xs text-on-surface-secondary mt-1`}>Inicia un viaje de prueba en el simulador.</p>
            </div>
          ) : filteredTrips.map((trip) => (
            <div 
              key={trip.id}
              onClick={() => loadTripDetails(trip)}
              className={`p-5 rounded-[1.25rem] border transition-all cursor-pointer group relative overflow-hidden ${
                selectedTrip?.id === trip.id 
                ? 'bg-primary border-primary shadow-lg shadow-primary/30 text-on-surface-primary' 
                : `bg-surface-primary border border-border-primary hover:border-border-secondary`
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase ${selectedTrip?.id === trip.id ? 'bg-surface-primary text-primary' : 'bg-primary text-on-surface-primary'}`}>
                  {trip.plate || 'MÓVIL'}
                </span>
                <span className={`text-[10px] font-bold ${selectedTrip?.id === trip.id ? 'text-on-surface-primary' : 'text-on-surface-secondary'}`}>
                  {new Date(trip.last_update).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${selectedTrip?.id === trip.id ? 'bg-primary' : 'bg-surface-secondary/50'}`}>
                  <Truck size={20} className={selectedTrip?.id === trip.id ? 'text-on-surface-primary' : 'text-primary'} />
                </div>
                <div>
                   <p className={`text-sm font-bold ${selectedTrip?.id === trip.id ? 'text-on-surface-primary' : 'text-on-surface-primary'}`}>
                      {trip.driver_name}
                    </p>
                   <p className={`text-xs font-black uppercase ${selectedTrip?.id === trip.id ? 'text-on-surface-primary' : 'text-on-surface-secondary'}`}>
                      Duración: {formatDuration(trip.start_time, trip.end_time)}
                   </p>
                   <p className={`text-[10px] flex items-center gap-1 ${selectedTrip?.id === trip.id ? 'text-on-surface-primary' : 'text-on-surface-secondary'}`}>
                      <Gauge size={10} /> V. Máx: {trip.max_speed?.toFixed(1) ?? 0} km/h - V. Prom: {trip.avg_speed?.toFixed(1) ?? 0} km/h
                   </p>
                </div>
                <ChevronRight className={`ml-auto transition-colors ${selectedTrip?.id === trip.id ? 'text-on-surface-primary' : 'text-on-surface-secondary group-hover:text-primary'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className={`bg-surface-primary rounded-[2rem] border border-border-primary overflow-hidden relative shadow-inner ${theme === 'dark' ? 'shadow-none' : ''}`}>
          {!selectedTrip ? (
            <div className={`absolute inset-0 flex flex-col items-center justify-center text-on-surface-secondary`}>
              <div className={`p-8 bg-surface-primary rounded-full mb-4 ring-1 ring-border-primary`}>
                <Truck size={40} className="opacity-40" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Selecciona un recorrido del historial</p>
            </div>
          ) : (
            <MapContainer key={theme} center={[-34.6, -58.4]} zoom={12} className="h-full w-full" zoomControl={false}>
              <ThemedMapLayer theme={theme} />
              {routeLogs.length > 1 && (
                <>
                  <SpeedPolyline routeLogs={routeLogs} />
                  <RecenterMap points={routeLogs.map(l => [l.lat, l.lng])} />
                  <CircleMarker center={routeLogs[0]} radius={8} pathOptions={{ fillColor: '#10b981', color: 'white', weight: 3, fillOpacity: 1 }}><Tooltip>Inicio</Tooltip></CircleMarker>
                  <CircleMarker center={routeLogs[routeLogs.length - 1]} radius={8} pathOptions={{ fillColor: '#ef4444', color: 'white', weight: 3, fillOpacity: 1 }}><Tooltip>Fin</Tooltip></CircleMarker>
                  {stops.map((stop, i) => (
                    <StopMarker key={i} position={stop.position} time={stop.time} />
                  ))}
                </>
              )}
            </MapContainer>
          )}
        </div>

        {selectedTrip && (
          <div className={`bg-surface-primary border border-border-primary rounded-[1.75rem] p-6 flex items-center justify-between animate-in slide-in-from-bottom-6`}>
            <div className="flex gap-8">
              <InfoCard theme={theme} icon={<Award className="text-yellow-500" />} label="Puntaje" value="98/100" />
              <InfoCard theme={theme} icon={<Gauge className="text-cyan-500" />} label="Vel. Máx" value={`${selectedTrip.max_speed?.toFixed(1) ?? 0} km/h`} />
              <InfoCard theme={theme} icon={<ShieldCheck className="text-amber-500" />} label="Vel. Prom" value={`${selectedTrip.avg_speed?.toFixed(1) ?? 0} km/h`} />
            </div>
            <button onClick={exportPDF} disabled={routeLogs.length === 0} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-primary-hover transition-all flex items-center gap-3 disabled:bg-surface-secondary disabled:text-on-surface-secondary disabled:cursor-not-allowed">
              <Download size={18} /> EXPORTAR PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value }: any) => (
  <div className={`flex items-center gap-4 px-6 border-r border-border-primary first:pl-0 last:border-none`}>
    <div className={`p-3 bg-surface-secondary/50 rounded-2xl`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-on-surface-secondary uppercase">{label}</p>
      <p className={`text-xl font-black text-on-surface-primary`}>{value}</p>
    </div>
  </div>
);

export default HistoryPanel;