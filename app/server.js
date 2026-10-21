const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const COLOR = process.env.APP_COLOR || 'blue';
const VERSION = process.env.APP_VERSION || '1.0.0';

let isHealthy = true;
let requestCount = 0;

// Main endpoint showing active environment and version
app.get('/', (req, res) => {
  requestCount++;
  res.json({
    status: 'online',
    environment: COLOR.toUpperCase(),
    version: VERSION,
    requestCount: requestCount,
    timestamp: new Date().toISOString(),
    message: `Hello from the ${COLOR.toUpperCase()} environment!`
  });
});

// Health check endpoint used by the deployment script
app.get('/health', (req, res) => {
  if (isHealthy) {
    res.status(200).json({
      status: 'HEALTHY',
      environment: COLOR,
      version: VERSION,
      uptimeSeconds: Math.floor(process.uptime())
    });
  } else {
    res.status(500).json({
      status: 'UNHEALTHY',
      environment: COLOR,
      version: VERSION
    });
  }
});

// Chaos endpoint: Simulate unhealthy build to test zero-downtime safety
app.post('/chaos/fail', (req, res) => {
  isHealthy = false;
  res.send(`Health status set to UNHEALTHY for ${COLOR}`);
});

app.post('/chaos/recover', (req, res) => {
  isHealthy = true;
  res.send(`Health status set to HEALTHY for ${COLOR}`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${COLOR.toUpperCase()}] Server running on port ${PORT} (Version: ${VERSION})`);
});
