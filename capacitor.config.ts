import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: process.env.BUNDLE_ID || 'com.example.unitracker',
  appName: process.env.APP_NAME || 'UniTracker',
  webDir: 'dist',
  // For live reload on emulators/devices, you can set CAP_SERVER_URL, e.g.:
  // Genymotion: http://10.0.3.2:5173
  // Android Studio emulator: http://10.0.2.2:5173
  // Physical device on LAN: http://<your_lan_ip>:5173
  // When CAP_SERVER_URL is set, we enable cleartext http for dev.
  server: process.env.CAP_SERVER_URL
    ? {
        url: process.env.CAP_SERVER_URL,
        cleartext: true,
      }
    : {
        androidScheme: 'https',
      }
};

export default config;
