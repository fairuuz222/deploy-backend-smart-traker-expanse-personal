// backend/src/index.ts
import app from "./app";
import os from 'os';
import config from './utils/env';

// --- LOGIKA SEDERHANA & AMAN ---
// Cek apakah kode ini dijalankan di Vercel?
// Vercel otomatis menambahkan process.env.VERCEL = '1'
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  // Masuk sini HANYA jika di Laptop (Local) atau Railway/VPS biasa
  app.listen(config.PORT, config.HOST, () => {
    console.log(`Server running at http://${config.HOST}:${config.PORT}`);

    if (config.HOST === '0.0.0.0') {
      const nets = os.networkInterfaces();
      console.log('Accessible network addresses:');
      for (const name of Object.keys(nets)) {
        const netInfo = nets[name] || [];
        for (const net of netInfo) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`  - http://${net.address}:${config.PORT}/ (interface: ${name})`);
          }
        }
      }
      console.log('Use one of the above IPs from your device browser or set HOST to one of them in .env');
    }
  });
}

// Tetap export app untuk Vercel
export default app;