# Blue-Green Deployment Strategy

A production-grade Blue-Green deployment setup built for the [roadmap.sh Blue-Green Deployment Project](https://roadmap.sh/projects/blue-green-deployment).

## Architecture

```
                      [ Incoming Traffic: Port 80 ]
                                   │
                                   ▼
                      ┌─────────────────────────┐
                      │   Nginx Reverse Proxy   │
                      │  (Zero-Downtime Reload) │
                      └────────────┬────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
      ┌─────────────────────┐             ┌─────────────────────┐
      │   Blue Container    │             │   Green Container   │
      │   (Live v1.0.0)     │             │   (Target v2.0.0)   │
      │    Port: 8081       │             │    Port: 8082       │
      └─────────────────────┘             └─────────────────────┘
```

## Features
- **Zero Downtime**: Traffic is routed via Nginx (`nginx -s reload`) without dropping in-flight connections.
- **Automated Health Verification**: New version is only exposed after `/health` responds with HTTP 200.
- **Safe Rollback**: Previous environment remains alive for instant rollback (`./scripts/rollback.ps1`).
- **Live Traffic Monitoring**: Includes real-time request latency and status monitoring (`./scripts/monitor.ps1`).
- **CI/CD Pipeline**: Automated GitHub Actions workflow for testing and deploying.

## How to Run

### 1. Start the Base Environment
```powershell
docker compose up -d
```
Visit `http://localhost/` in your browser. You will see response from the `BLUE` environment.

### 2. Live Monitoring (Zero-Downtime Proof)
Open a separate terminal window and run:
```powershell
.\scripts\monitor.ps1
```

### 3. Deploy New Version (Green)
In your main terminal, run:
```powershell
.\scripts\deploy.ps1 -TargetVersion "2.0.0"
```
Notice in the monitoring terminal that the output seamlessly transitions from `BLUE` to `GREEN` with 0 dropped requests!

### 4. Rollback (If needed)
```powershell
.\scripts\rollback.ps1
```

## Project Page
- Reference: [roadmap.sh Blue-Green Deployment](https://roadmap.sh/projects/blue-green-deployment)
