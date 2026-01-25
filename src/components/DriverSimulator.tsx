import { useState, useEffect } from 'react';
import { Smartphone, X, Activity, Navigation } from 'lucide-react';
import { supabase, saveLocationUpdate } from '../services/supabaseClient';

const WORLD_MAP_BG = "https://i.imgur.com/8yX90qM.png";

const DriverSimulator = ({ onClose, user }: any) => {
  const [isTracking, setIsTracking] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [speed, setSpeed] = useState(0);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Función para iniciar o detener el viaje
  const toggleTracking = async () => {
    if (isTracking) {
      setIsTracking(false);
      
      // Cálculo de métricas finales
      const maxSpeed = speedHistory.length > 0 ? Math.max(...speedHistory) : 0;
      const avgSpeed = speedHistory.length > 0 ? speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length : 0;

      if (currentTripId) {
          await supabase.from('trips').update({
            status: 'finalizado',
            end_time: new Date().toISOString(),
            max_speed: maxSpeed,
            avg_speed: avgSpeed
          }).eq('id', currentTripId);
      }
      setSpeed(0);
      setLogs(prev => [`🛑 Viaje finalizado.`, ...prev]);
    } else {
      if (!vehiclePlate) return alert("Ingresá la patente del vehículo");
      
      const newTripId = crypto.randomUUID();
      setCurrentTripId(newTripId);
      setSpeedHistory([]);
      setLogs([]);

      // Registro inicial en la base de datos
      const { error } = await supabase.from('trips').insert([{
        id: newTripId,
        plate: vehiclePlate,
        driver_id: user.id,
        driver_name: user.full_name, // Captura automática del nombre
        status: 'en_curso',
        start_time: new Date().toISOString()
      }]);

      if (error) {
        console.error("Error Supabase:", error);
        return;
      }

      setIsTracking(true);
      setLogs(prev => [`🚀 Iniciando viaje: ${vehiclePlate}`, ...prev]);
    }
  };

  // Efecto de simulación de movimiento y GPS
  useEffect(() => {
    let interval: any;
    if (isTracking && currentTripId) {
      interval = setInterval(() => {
        setSpeed(prev => {
            // Simulación de velocidad variable
            const newSpeed = Math.round(Math.max(0, Math.min(120, prev + (Math.random() * 12 - 5))));
            setSpeedHistory(s => [...s, newSpeed]);
            
            // Envío de coordenadas a la tabla de logs
            saveLocationUpdate(currentTripId, -34.6037 + (Math.random() * 0.01), -58.3816 + (Math.random() * 0.01), newSpeed, vehiclePlate, user.company_id);
            
            setLogs(l => [`📍 GPS: ${newSpeed} km/h`, ...l.slice(0, 5)]);
            return newSpeed;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentTripId, vehiclePlate, user.company_id]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      {/* Contenedor Principal con fondo de Mapa */}
      <div className="relative w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
           style={{ backgroundImage: `url(${WORLD_MAP_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-black"></div>

        <div className="relative p-8">
            {/* Header del Simulador */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30 animate-pulse">
                        <Activity className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-white font-black tracking-tighter text-xl">TERMINAL M4</h2>
                        <p className="text-blue-400/60 text-[10px] uppercase font-bold tracking-widest">Telemetría Satelital</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/20 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-6">
                {/* Input de Patente (Solo visible si no está trackeando) */}
                {!isTracking && (
                    <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            value={vehiclePlate}
                            onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                            placeholder="PATENTE DEL VEHÍCULO"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-center tracking-[0.3em] focus:border-blue-500/50 outline-none transition-all placeholder:text-white/10"
                        />
                    </div>
                )}

                {/* Display de Velocidad con Icono Navigation */}
                <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 text-center group">
                    <Navigation className="mx-auto mb-4 text-blue-500/30 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-500" size={32} />
                    <div className="text-7xl font-black text-white tracking-tighter mb-1">
                        {speed}<span className="text-xl text-blue-500 ml-2">km/h</span>
                    </div>
                    <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Velocidad en Tiempo Real</div>
                </div>

                {/* Botón de Acción */}
                <button
                    onClick={toggleTracking}
                    disabled={!vehiclePlate && !isTracking}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl ${
                        isTracking 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/40 disabled:opacity-20 disabled:cursor-not-allowed'
                    }`}
                >
                    {isTracking ? 'Finalizar Viaje' : 'Iniciar Simulación'}
                </button>

                {/* Consola de Logs */}
                {logs.length > 0 && (
                    <div className="bg-black/60 rounded-2xl p-4 h-32 overflow-y-auto font-mono text-[10px] text-blue-300/40 space-y-1 border border-white/5 custom-scrollbar">
                        {logs.map((log, i) => (
                          <div key={i} className={i === 0 ? "text-blue-400 border-b border-blue-500/10 pb-1 mb-1" : ""}>
                            {log}
                          </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSimulator;