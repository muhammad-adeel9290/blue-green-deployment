const http = require('http');
const httpProxy = require('http'); // native proxy
const { spawn } = require('child_process');

console.log('=== BLUE-GREEN DEPLOYMENT SIMULATION (STANDALONE) ===\n');

// 1. Start Blue instance (Port 8081)
let blueEnv = Object.assign({}, process.env, { PORT: '8081', APP_COLOR: 'blue', APP_VERSION: '1.0.0' });
const blueProcess = spawn('node', ['app/server.js'], { env: blueEnv, stdio: 'inherit' });

// 2. Start Green instance (Port 8082)
let greenEnv = Object.assign({}, process.env, { PORT: '8082', APP_COLOR: 'green', APP_VERSION: '2.0.0' });
const greenProcess = spawn('node', ['app/server.js'], { env: greenEnv, stdio: 'inherit' });

let activeTargetPort = 8081; // Blue is initially active

// 3. Lightweight Reverse Proxy on Port 8080 (equivalent to Nginx)
const proxyServer = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: '127.0.0.1',
    port: activeTargetPort,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
    clientRes.end('Bad Gateway');
  });

  clientReq.pipe(proxyReq, { end: true });
});

proxyServer.listen(8080, () => {
  console.log('\n[REVERSE PROXY] Listening on http://localhost:8080');
  console.log('[REVERSE PROXY] Currently routing traffic to: BLUE (Port ' + activeTargetPort + ')');
  console.log('\nTesting instructions:');
  console.log('1. Open browser: http://localhost:8080/ (See Blue response)');
  console.log('2. In PowerShell run: node scripts/switch.js green (Switches to Green without downtime!)');
});

// Clean up child processes on exit
process.on('SIGINT', () => {
  blueProcess.kill();
  greenProcess.kill();
  process.exit();
});
