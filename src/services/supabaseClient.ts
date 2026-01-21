import { createClient } from '@supabase/supabase-js';

// Inicialización del cliente de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exportamos 'supabase' para que App.tsx lo encuentre
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Función para guardar la ubicación cada 5 segundos.
 * Ahora incluye Patente y Company ID para el aislamiento.
 */
export const saveLocationUpdate = async (
  tripId: string, 
  lat: number, 
  lng: number, 
  speed: number, 
  plate?: string, 
  companyId?: string
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
          company_id: companyId 
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
        company_id: companyId,
        last_update: new Date().toISOString()
      });

  } catch (error) {
    console.error("Error en la sincronización:", error);
  }
};