import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("FATAL ERROR: Supabase URL or Anon Key is missing in the .env file");
    alert("FATAL ERROR: La configuración de Supabase está incompleta. La aplicación no puede funcionar.");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export const saveLocationUpdate = async (tripId: string, lat: number, lng: number, speed: number) => {
    const { error } = await supabase.from('trip_logs').insert({
        trip_id: tripId,
        lat: lat,
        lng: lng,
        speed: speed,
        timestamp: new Date().toISOString()
    });

    if (error) {
        console.error("Error saving location update:", error);
        // In a real app, you might want to queue this up for a retry.
        throw new Error(`Failed to save location: ${error.message}`);
    }
    
    console.log("📍 Location point saved:", { lat, lng, speed });
};