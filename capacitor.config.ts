import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: process.env.BUNDLE_ID || 'com.example.unitracker',
  appName: process.env.APP_NAME || 'UniTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
