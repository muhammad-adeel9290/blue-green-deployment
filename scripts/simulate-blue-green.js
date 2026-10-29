const http = require('http');
const { spawn } = require('child_process');

console.log('=== BLUE-GREEN DEPLOYMENT SIMULATION (STANDALONE) ===\n');

// 1. Start Blue instance (Port 8081)
let blueEnv = Object.assign({}, process.env, { PORT: '8081', APP_COLOR: 'blue', APP_VERSION: '1.0.0' });
const blueProcess = spawn('node', ['app/server.js'], { env: blueEnv, stdio: 'inherit' });

// 2. Start Green instance (Port 8082)
let greenEnv = Object.assign({}, process.env, { PORT: '8082', APP_COLOR: 'green', APP_VERSION: '2.0.0' });
const greenProcess = spawn('node', ['app/server.js'], { env: greenEnv, stdio: 'inherit' });

let activeTargetPort = 8081; // Blue is initially active
let activeTargetColor = 'BLUE';

// 3. Lightweight Reverse Proxy on Port 8080 (equivalent to Nginx)
const proxyServer = http.createServer((clientReq, clientRes) => {
  // Allow manual switch via admin endpoint or switch.js
  if (clientReq.url.startsWith('/admin/switch/')) {
    const target = clientReq.url.split('/admin/switch/')[1].toLowerCase();
    if (target === 'green') {
      activeTargetPort = 8082;
      activeTargetColor = 'GREEN';
    } else {
      activeTargetPort = 8081;
      activeTargetColor = 'BLUE';
    }
    console.log(`\n[REVERSE PROXY] Traffic switched to: ${activeTargetColor} (Port ${activeTargetPort})`);
    clientRes.writeHead(200, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ status: 'ok', active: activeTargetColor, port: activeTargetPort }));
    return;
  }

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
  console.log('2. In another terminal run: node scripts/switch.js green (Switches to Green without downtime!)');
  console.log('3. Open browser: http://localhost:8080/ (See Green response)');
});

// Clean up child processes on exit
const cleanup = () => {
  try { blueProcess.kill(); } catch (e) {}
  try { greenProcess.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
