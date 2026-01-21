import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Trip } from '../types';
import { supabase } from '../services/supabaseClient';

interface LiveTrip {
  id: string;
  last_lat: number;
  last_lng: number;
  last_speed: number;
  plate: string;
  company_id?: string;
  last_update: string;
  driver_id: string;
}

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/6134/6134825.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: 'truck-marker-glow', // Add this line
});

const DashboardMap: React.FC = () => {
  const [trips, setTrips] = useState<LiveTrip[]>([]);

  useEffect(() => {
    fetchTrips();
    const interval = setInterval(() => {
      fetchTrips();
    }, 5000); // 5-second polling

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*');

      if (error) throw error;
      
      if (data) {
        // Group by driver_id and get the latest trip for each driver
        const latestTrips = data.reduce((acc: { [key: string]: any }, currentTrip: any) => {
          // Ensure driver_id is a string, if it's not already
          const driverId = String(currentTrip.driver_id);
          if (!acc[driverId] || new Date(currentTrip.last_update) > new Date(acc[driverId].last_update)) {
            acc[driverId] = currentTrip;
          }
          return acc;
        }, {});
        setTrips(Object.values(latestTrips) as LiveTrip[]);
      }

    } catch (e) {
      console.warn("Supabase fetch failed.", e);
    } 
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4">
      {/* Map Area */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-lg border border-border-primary relative z-0">
        <MapContainer center={[-34.6037, -58.3816]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {trips.map((trip: LiveTrip) => (
            <Marker
              key={trip.id}
              position={[trip.last_lat, trip.last_lng]}
              icon={truckIcon}
            >
              <Popup>
                <div className="font-sans min-w-[150px]">
                  <strong className="block text-sm text-on-surface-primary mb-1">{trip.plate}</strong>
                  <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-secondary">
                     <span className="text-cyan-500">Vel: {trip.last_speed || 0} km/h</span>
                  </div>
                  <div className="mt-2 text-xs text-on-surface-secondary/70">
                    Último Ping: {new Date(trip.last_update).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Status Overlay */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
            <div className={`px-3 py-1 rounded-full shadow-md text-xs font-semibold flex items-center gap-2 bg-surface-primary text-amber-500`}>
                <div className={`w-2 h-2 rounded-full bg-amber-500 animate-pulse`}></div>
                {'Polling Activo'}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMap;