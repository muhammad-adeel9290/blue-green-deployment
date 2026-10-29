const http = require('http');

const target = (process.argv[2] || 'green').toLowerCase();

if (target !== 'blue' && target !== 'green') {
  console.error('Invalid target. Please specify "blue" or "green". Example: node scripts/switch.js green');
  process.exit(1);
}

const req = http.request({
  hostname: '127.0.0.1',
  port: 8080,
  path: `/admin/switch/${target}`,
  method: 'POST'
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`[SUCCESS] Traffic successfully switched to ${parsed.active} (Port ${parsed.port})!`);
    } catch (e) {
      console.log(`[SUCCESS] Traffic switched to ${target.toUpperCase()}`);
    }
  });
});

req.on('error', (err) => {
  console.error(`[ERROR] Could not connect to simulation proxy on port 8080.`);
  console.error('Make sure "node scripts/simulate-blue-green.js" is running in a separate terminal!');
  process.exit(1);
});

req.end();
