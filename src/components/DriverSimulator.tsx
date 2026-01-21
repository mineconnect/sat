import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, X } from 'lucide-react';
import type { UserProfile } from '../types';
import { saveLocationUpdate } from '../services/supabaseClient';

// Simulador de Conductor Refactorizado
const DriverSimulator = ({ onClose, user }: { onClose: () => void, user: UserProfile }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [plate, setPlate] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(0);
  const intervalRef = useRef<any>(null);
  const speedIntervalRef = useRef<any>(null);

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setPlate(value);
  };

  const accelerate = () => {
    setSpeed(s => {
      const newSpeed = s + 2;
      if (newSpeed >= 75) {
        clearInterval(speedIntervalRef.current);
        return 75;
      }
      return newSpeed;
    });
  };

  const decelerate = () => {
    setSpeed(s => {
        const newSpeed = s - 5;
        if (newSpeed <= 0) {
            clearInterval(speedIntervalRef.current);
            return 0;
        }
        return newSpeed;
    });
  };

  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = setInterval(decelerate, 100);
      setLogs(p => ["🛑 Viaje finalizado.", "📡 GPS Desconectado.", ...p]);
      setCurrentTripId(null);
    } else {
      if (plate.length < 6) { 
        alert("⚠️ Patente inválida. Debe contener al menos 6 caracteres alfanuméricos."); 
        return; 
      }
      const newTripId = `TRIP-${plate}-${Date.now()}`;
      setCurrentTripId(newTripId);
      setIsTracking(true);
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = setInterval(accelerate, 100);
      setLogs(p => [`🚀 Iniciando viaje para ${plate}`, "🛰️ Buscando Satélites...", ...p]);
    }
  };

  useEffect(() => {
    if (isTracking && currentTripId) {
      intervalRef.current = setInterval(() => {
        const lat = -34.6037 + (Math.random() - 0.5) * 0.02;
        const lng = -58.3816 + (Math.random() - 0.5) * 0.02;
        saveLocationUpdate(currentTripId, lat, lng, speed, plate, user.company_id || undefined);
        setLogs(p => [`📍 ${new Date().toLocaleTimeString()} | ${speed} km/h`, ...p.slice(0, 10)]);
      }, 5000);
    }
    return () => { 
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
    };
  }, [isTracking, currentTripId, plate, user.company_id, speed]);

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-surface-primary border border-border-primary w-full max-w-md rounded-xl shadow-2xl shadow-primary/20 flex flex-col max-h-[90vh] relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-on-surface-secondary hover:text-on-surface-primary transition-colors z-10">
          <X size={24} />
        </button>
        <div className="flex-shrink-0 p-6 pt-8 text-center">
            <Smartphone className="w-10 h-10 text-primary mb-2 mx-auto" />
            <h2 className="text-lg font-bold text-on-surface-primary uppercase">Terminal de Conductor</h2>
        </div>

        <div className="flex-grow p-6 flex flex-col items-center overflow-y-auto custom-scrollbar">
          <input 
            type="text" value={plate} onChange={handlePlateChange} disabled={isTracking} placeholder="PATENTE"
            className="w-full bg-surface-secondary/50 border-2 border-border-primary rounded-lg py-3 text-center text-xl font-mono font-bold text-on-surface-primary mb-6 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <button onClick={toggleTracking} className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center text-2xl font-black transition-all transform hover:scale-105 active:scale-95 ${isTracking ? 'border-red-600 bg-red-800/30 text-red-400 shadow-lg shadow-red-500/20' : 'border-green-600 bg-green-800/30 text-green-400 shadow-lg shadow-green-500/20'}`}>
            <span>{isTracking ? 'DETENER' : 'INICIAR'}</span>
            <span className="text-lg font-bold">VIAJE</span>
          </button>
          <div className="w-full mt-6 bg-surface-secondary/40 rounded-xl p-3 text-xs font-mono text-on-surface-secondary border border-border-primary h-40 overflow-y-auto">
            {logs.map((l, i) => <div key={i} className="border-b border-border-primary py-1 animate-in fade-in">{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSimulator;
