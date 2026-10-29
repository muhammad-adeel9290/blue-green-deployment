const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../server.js');

describe('Blue-Green Server Unit & Integration Tests', () => {
  let server;
  let baseUrl;

  before(() => {
    return new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  test('GET / should return 200 and online status', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'online');
    assert.ok(body.environment);
    assert.ok(body.version);
    assert.ok(body.timestamp);
  });

  test('GET /health should return 200 and HEALTHY', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'HEALTHY');
  });

  test('Chaos endpoints simulate failure and recovery correctly', async () => {
    // 1. Trigger failure
    const failRes = await fetch(`${baseUrl}/chaos/fail`, { method: 'POST' });
    assert.strictEqual(failRes.status, 200);

    // 2. Health check should fail with 500
    const healthUnhealthy = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthUnhealthy.status, 500);
    const unhealthyBody = await healthUnhealthy.json();
    assert.strictEqual(unhealthyBody.status, 'UNHEALTHY');

    // 3. Trigger recovery
    const recoverRes = await fetch(`${baseUrl}/chaos/recover`, { method: 'POST' });
    assert.strictEqual(recoverRes.status, 200);

    // 4. Health check should be 200 again
    const healthHealthy = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthHealthy.status, 200);
    const healthyBody = await healthHealthy.json();
    assert.strictEqual(healthyBody.status, 'HEALTHY');
  });
});
