import { supabase } from '../lib/supabase'; // Assuming this path
import type { UserProfile } from '../../src/types'; // Assuming types are accessible or re-defined

interface TrackingOptions {
  plate: string;
  user: UserProfile;
  onLocationUpdate?: (lat: number, lng: number, speed: number) => void;
  onLog?: (message: string) => void;
}

class TrackingService {
  private intervalRef: number | null = null;
  private speedIntervalRef: number | null = null;
  private speed: number = 0;
  private isTracking: boolean = false;
  private currentTripId: string | null = null;
  private plate: string = '';
  private user: UserProfile | null = null;
  private onLocationUpdate: ((lat: number, lng: number, speed: number) => void) | undefined;
  private onLog: ((message: string) => void) | undefined;

  constructor() {}

  private accelerate = () => {
    this.speed += 2;
    if (this.speed >= 75) {
      this.speed = 75;
      if (this.speedIntervalRef) clearInterval(this.speedIntervalRef);
      this.speedIntervalRef = null;
    }
  };

  private decelerate = () => {
    this.speed -= 5;
    if (this.speed <= 0) {
      this.speed = 0;
      if (this.speedIntervalRef) clearInterval(this.speedIntervalRef);
      this.speedIntervalRef = null;
    }
  };

  public startTracking = (options: TrackingOptions) => {
    if (this.isTracking) {
      this.onLog?.("Tracking ya está activo.");
      return;
    }

    this.plate = options.plate;
    this.user = options.user;
    this.onLocationUpdate = options.onLocationUpdate;
    this.onLog = options.onLog;

    if (this.plate.length < 6) {
      this.onLog?.("⚠️ Patente inválida. Debe contener al menos 6 caracteres alfanuméricos.");
      return;
    }

    this.currentTripId = `TRIP-${this.plate}-${Date.now()}`;
    this.isTracking = true;

    this.onLog?.(`🚀 Iniciando viaje para ${this.plate}`);
    this.onLog?.("🛰️ Buscando Satélites...");

    // Start accelerating
    if (this.speedIntervalRef) clearInterval(this.speedIntervalRef);
    this.speedIntervalRef = setInterval(this.accelerate, 100) as unknown as number; // Node.js clearInterval expects NodeJS.Timeout, but browser uses number

    this.intervalRef = setInterval(this.sendLocationUpdate, 5000) as unknown as number;
  };

  public stopTracking = () => {
    if (!this.isTracking) {
      this.onLog?.("Tracking no está activo.");
      return;
    }

    this.isTracking = false;
    if (this.intervalRef) clearInterval(this.intervalRef);
    this.intervalRef = null;

    this.onLog?.("🛑 Viaje finalizado.");
    this.onLog?.("📡 GPS Desconectado.");

    // Start decelerating
    if (this.speedIntervalRef) clearInterval(this.speedIntervalRef);
    this.speedIntervalRef = setInterval(this.decelerate, 100) as unknown as number;
    
    this.currentTripId = null;
  };

  private sendLocationUpdate = async () => {
    if (!this.isTracking || !this.currentTripId || !this.user) return;

    // Simulate location changes around Buenos Aires
    const lat = -34.6037 + (Math.random() - 0.5) * 0.02;
    const lng = -58.3816 + (Math.random() - 0.5) * 0.02;

    await this.saveLocationUpdate(this.currentTripId, lat, lng, this.speed, this.plate, this.user.company_id || undefined);
    this.onLocationUpdate?.(lat, lng, this.speed);
    this.onLog?.(`📍 ${new Date().toLocaleTimeString()} | ${this.speed} km/h`);
  };

  private saveLocationUpdate = async (
    tripId: string,
    lat: number,
    lng: number,
    speed: number,
    plate: string,
    company_id?: string
  ) => {
    try {
      // 1. Guardamos el rastro histórico (para el trazado de ruta)
      await supabase
        .from('trip_logs')
        .insert([
          { 
            trip_id: tripId, 
            lat, 
            lng, 
            speed, 
            plate,
            company_id: company_id,
            created_at: new Date().toISOString(),
          }
        ]);

      // 2. Actualizamos el estado actual del vehículo (para el monitoreo en vivo)
      await supabase
        .from('trips')
        .upsert({ 
          id: tripId, 
          last_lat: lat, 
          last_lng: lng, 
          last_speed: speed,
          plate: plate,
          company_id: company_id,
          last_update: new Date().toISOString()
        });

    } catch (error: any) {
      console.error("Error en la sincronización de ubicación para móvil:", error.message);
    }
  };

  public getIsTracking = () => this.isTracking;
  public getSpeed = () => this.speed;
}

export const trackingService = new TrackingService();
