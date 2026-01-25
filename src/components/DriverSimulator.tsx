import { useState, useEffect } from 'react';
import { Smartphone, X, Activity, Navigation, Zap } from 'lucide-react';
import { supabase, saveLocationUpdate } from '../services/supabaseClient';

const DriverSimulator = ({ onClose, user }: any) => {
  const [isTracking, setIsTracking] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [speed, setSpeed] = useState(0);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const toggleTracking = async () => {
    if (isTracking) {
      setIsTracking(false);
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
      setLogs(prev => [`🛑 Viaje Finalizado.`, ...prev]);
    } else {
      if (!vehiclePlate || vehiclePlate.length < 6) {
        alert("⚠️ Ingresa una patente válida.");
        return;
      }
      
      // SOLUCIÓN AL ERROR DE UUID: Usamos crypto.randomUUID()
      const newTripId = crypto.randomUUID();
      setCurrentTripId(newTripId);
      setSpeedHistory([]);
      setLogs([]);

      // Enviamos 'vehicle_id' para que la base de datos no proteste
      const { error } = await supabase.from('trips').insert([{
        id: newTripId,
        plate: vehiclePlate,
        vehicle_id: vehiclePlate, // Enviamos el dato a ambas columnas por seguridad
        driver_id: user.id,
        driver_name: user.full_name,
        status: 'en_curso',
        start_time: new Date().toISOString()
      }]);

      if (error) {
        console.error("Error al iniciar:", error);
        alert(`Error: ${error.message}`);
        return;
      }

      setIsTracking(true);
      setLogs(prev => [`🟢 Viaje iniciado: ${vehiclePlate}`, ...prev]);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isTracking && currentTripId) {
      interval = setInterval(() => {
        setSpeed(prev => {
            const noise = Math.random() * 15 - 6; 
            let newSpeed = Math.round(prev + noise);
            newSpeed = Math.max(0, Math.min(130, newSpeed));
            setSpeedHistory(s => [...s, newSpeed]);
            saveLocationUpdate(currentTripId, -34.6037 + (Math.random() * 0.02), -58.3816 + (Math.random() * 0.02), newSpeed, vehiclePlate, user.company_id);
            return newSpeed;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentTripId, vehiclePlate, user.company_id]);

  return (
    // CAMBIO: bg-black/20 y backdrop-blur para que sea una ventana flotante real
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      
      {/* Terminal Principal - Diseño M4 Redondeado */}
      <div className="relative w-full max-w-[400px] bg-slate-950 rounded-[3.5rem] overflow-hidden border-2 border-blue-500/20 shadow-2xl">
        
        <div className="absolute inset-0 bg-[#020617] z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent z-0"></div>

        <div className="relative z-10 p-10 flex flex-col items-center">
            
            <div className="w-full flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                        <Activity className="text-blue-400 animate-pulse" size={20} />
                    </div>
                    <h2 className="text-white font-black text-xl tracking-tighter">TERMINAL M4</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
                    <X size={20}/>
                </button>
            </div>

            {!isTracking && (
                <div className="w-full mb-8 relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={20} />
                    <input
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                        placeholder="PATENTE"
                        className="w-full bg-slate-900/80 border border-white/10 rounded-2xl py-5 pl-12 pr-4 text-white font-black text-center text-xl tracking-[0.3em] outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>
            )}

            {isTracking && (
                <div className="w-full mb-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex flex-col items-center">
                    <div className="text-white font-black text-6xl tracking-tighter flex items-baseline">
                        {speed}<span className="text-xl text-blue-500 ml-1">km/h</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 font-bold text-[10px] text-blue-400/40 uppercase tracking-widest">
                        <Navigation className="animate-spin" style={{ animationDuration: '3s' }} size={12} />
                        En Movimiento
                    </div>
                </div>
            )}

            {/* BOTÓN REDONDO */}
            <div className="relative mb-10">
                <div className={`absolute -inset-4 rounded-full border border-dashed animate-[spin_20s_linear_infinite] opacity-20 ${isTracking ? 'border-red-500' : 'border-emerald-500'}`}></div>
                
                <button
                    onClick={toggleTracking}
                    className={`relative w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl active:scale-95 ${
                        isTracking 
                        ? 'bg-gradient-to-br from-red-600 to-red-900 border-4 border-red-400/30 shadow-red-500/40' 
                        : 'bg-gradient-to-br from-emerald-500 to-emerald-800 border-4 border-emerald-400/30 shadow-emerald-500/40'
                    }`}
                >
                    <Zap className="text-white mb-2 opacity-80" size={32} />
                    <span className="text-white font-black text-2xl tracking-tight uppercase">
                        {isTracking ? 'Detener' : 'Iniciar'}
                    </span>
                </button>
            </div>

            <div className="w-full bg-black/40 rounded-3xl border border-white/5 p-4 h-24 overflow-y-auto font-mono text-[10px] text-white/40">
                {logs.map((log, i) => (
                  <div key={i} className={i === 0 ? 'text-blue-400' : ''}>
                    [{new Date().toLocaleTimeString()}] {log}
                  </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSimulator;