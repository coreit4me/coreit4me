'use strict';

const os = require('node:os');
const { createServer } = require('./lib');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // listen on all interfaces so phones on the same Wi-Fi can connect

createServer().listen(PORT, HOST, () => {
  console.log(`hacker_spotted running:`);
  console.log(`  this computer:  http://localhost:${PORT}`);
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) {
        console.log(`  on your phone:  http://${a.address}:${PORT}`);
      }
    }
  }
});
