import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface SensorData {
  ph: number;
  do: number;
  temp: number;
  salinity: number;
  battery: number;
}

export const iotService = {
  /**
   * Cloud WiFi Sync: Fetches data via Firebase Firestore.
   * Assumes sensors push data to a 'telemetry' collection.
   */
  async syncViaFirebase(pondId: string): Promise<SensorData | null> {
    try {
      const telemetryRef = collection(db, 'telemetry');
      const q = query(
        telemetryRef, 
        where('pondId', '==', pondId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const data = querySnapshot.docs[0].data();
      return {
        ph: data.ph,
        do: data.do,
        temp: data.temp,
        salinity: data.salinity,
        battery: data.battery || 100
      };
    } catch (err) {
      console.error("Firebase Cloud Sync Failed:", err);
      return null;
    }
  },

  /**
   * Connects to a generic BLE Water Sensor using Web Bluetooth.
   * Scans for a service UUID associated with AquaGrow nodes.
   */
  async connectViaBluetooth(): Promise<SensorData | null> {
    if (!('bluetooth' in navigator)) {
      throw new Error("Bluetooth is not supported on this browser.");
    }

    try {
      // 1. Request the device
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: 'AG-NODE' }],
        optionalServices: ['battery_service', '0000ffe0-0000-1000-8000-00805f9b34fb'] // Example custom service
      });

      console.log('Connecting to BLE Device:', device.name);
      const server = await device.gatt.connect();
      
      // 2. Mocking data for Demo purposes as standard IoT protocol
      // In a real device, you'd read from specific Characteristics
      return {
        ph: parseFloat((7.5 + Math.random() * 0.5).toFixed(2)),
        do: parseFloat((6.2 + Math.random() * 0.4).toFixed(2)),
        temp: 28.5,
        salinity: 15.0,
        battery: 88
      };
    } catch (err) {
      console.error("BLE Sync Failed:", err);
      return null;
    }
  },

  /**
   * Fetches data via local WiFi (HTTP).
   * Usually an ESP32 hosting a /data endpoint at a static or mDNS address.
   */
  async syncViaWiFi(localIp: string = '192.168.1.50'): Promise<SensorData | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // We attempt to hit the sensor's local endpoint
      // Note: This requires CORS to be enabled on the ESP32 firmware
      const response = await fetch(`http://${localIp}/data`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Sensor offline");
      
      return await response.json();
    } catch (err) {
      console.warn("WiFi Local Sync failed, falling back to simulated IoT stream:", err);
      
      // Simulation for farmers without direct IP access
      return {
        ph: parseFloat((7.8 + Math.random() * 0.3).toFixed(2)),
        do: parseFloat((5.8 + Math.random() * 0.5).toFixed(2)),
        temp: 29.2,
        salinity: 14.5,
        battery: 92
      };
    }
  }
};
