# VAL Core Deployment Strategy

## 1. Application Architecture Analysis

### Application Type
VAL Core is a **full-stack financial clearing protocol** consisting of:
- **Frontend**: React 18 + TypeScript + Vite (client-side signing with ethers.js)
- **Backend**: Node.js + Express + tsx (authority gateway and attestation engine)
- **Clearing Layer**: TigerBeetle (native financial ledger with io_uring)
- **Narrative Mirror**: PostgreSQL (read-only observation layer)

### Key Components
1. **TigerBeetle (Mechanical Truth Authority)**: Immutable financial ledger (port 3000)
2. **Backend API**: Express server (port 3001) handling authentication and orchestration
3. **PostgreSQL Narrative Mirror**: Audit log and read-only reporting (port 5433)
4. **Frontend UI**: React application (port 5173) with client-side signing
5. **Honoring Adapters**: External integrations (Stripe, Instacart, Square, Tango, Arcus, Moov)

## 2. Local Development Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- TigerBeetle native binary (included in `tigerbeetle-main` directory)

### Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Start Postgres (Terminal 1)
npm run infra:up

# 3. Start TigerBeetle (Terminal 2 - native binary required for io_uring)
# Windows
.\tigerbeetle.exe start --addresses=0.0.0.0:3000 tigerbeetle_data/0_0.tigerbeetle
# Linux/Mac
./tigerbeetle start --addresses=0.0.0.0:3000 tigerbeetle_data/0_0.tigerbeetle

# 4. Start Backend (Terminal 3)
npm run server

# 5. Start Frontend (Terminal 4)
npm run dev
```

### Environment Variables
Copy `.env.example` to `.env.local` and configure:
- `ATTESTOR_PRIVATE_KEY`: Authority gateway signing key
- `PG*`: Postgres connection details
- `TB_*`: TigerBeetle configuration
- `*_API_KEY`/`*_API_SECRET`: Adapter credentials (for real-world integrations)

## 3. Staging/QA Environment

### Infrastructure Requirements
- **Cloud Provider**: AWS/GCP/Azure (VPC with private subnets)
- **Compute**: EC2 t3.medium (or equivalent) for TigerBeetle, t3.small for others
- **Storage**: EBS gp3 (for TigerBeetle data), RDS PostgreSQL (for narrative mirror)
- **Networking**: Security groups with restricted inbound/outbound rules

### Deployment Steps

```yaml
# docker-compose.staging.yml
version: '3.8'
services:
  tigerbeetle:
    image: ghcr.io/tigerbeetle/tigerbeetle:latest
    ports:
      - "3000:3000"
    volumes:
      - tigerbeetle_data:/data
    command: start --addresses=0.0.0.0:3000 /data/0_0.tigerbeetle
    restart: unless-stopped

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: sovr_admin
      POSTGRES_PASSWORD: ${PG_PASSWORD}
      POSTGRES_DB: sovr_narrative
    volumes:
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: staging
      ATTESTOR_PRIVATE_KEY: ${ATTESTOR_PRIVATE_KEY}
      PGHOST: postgres
      PGUSER: sovr_admin
      PGPASSWORD: ${PG_PASSWORD}
      PGDATABASE: sovr_narrative
      TB_ADDRESS: tigerbeetle:3000
    depends_on:
      - tigerbeetle
      - postgres
    restart: unless-stopped

  frontend:
    build: .
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3001
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  tigerbeetle_data:
  postgres_data:
```

### Staging Configuration
- Use separate API keys for external integrations
- Enable debug logging
- Configure monitoring/alerting (Prometheus + Grafana)
- Set up daily backups of PostgreSQL and TigerBeetle data

## 4. Production Deployment Options

### Option A: Cloud Provider (AWS)

```
VPC Structure:
├── Public Subnets
│   └── Application Load Balancer (ALB)
└── Private Subnets
    ├── TigerBeetle Cluster (3-node quorum)
    ├── PostgreSQL RDS (Multi-AZ)
    ├── Backend ECS/Fargate
    └── Frontend CloudFront + S3
```

#### TigerBeetle Deployment
```bash
# Create TigerBeetle cluster
tigerbeetle format --cluster=0 --replica=0 --replica_addresses=10.0.1.10:3000,10.0.1.11:3000,10.0.1.12:3000 /data/0_0.tigerbeetle
tigerbeetle format --cluster=0 --replica=1 --replica_addresses=10.0.1.10:3000,10.0.1.11:3000,10.0.1.12:3000 /data/0_1.tigerbeetle
tigerbeetle format --cluster=0 --replica=2 --replica_addresses=10.0.1.10:3000,10.0.1.11:3000,10.0.1.12:3000 /data/0_2.tigerbeetle

# Start each replica
tigerbeetle start --addresses=10.0.1.10:3000 /data/0_0.tigerbeetle
```

#### Backend Deployment (ECS Fargate)
```json
{
  "containerDefinitions": [
    {
      "name": "val-backend",
      "image": "your-ecr-repo/val-core:latest",
      "cpu": 256,
      "memory": 512,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "ATTESTOR_PRIVATE_KEY", "valueFrom": "arn:aws:ssm:region:account:parameter/val/attestor-private-key" },
        { "name": "TB_ADDRESS", "value": "10.0.1.10:3000,10.0.1.11:3000,10.0.1.12:3000" },
        { "name": "POSTGRES_URL", "valueFrom": "arn:aws:ssm:region:account:parameter/val/postgres-url" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/val-core",
          "awslogs-region": "region",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512"
}
```

### Option B: Kubernetes (EKS/GKE)

```yaml
# tigerbeetle-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: tigerbeetle
spec:
  serviceName: "tigerbeetle"
  replicas: 3
  selector:
    matchLabels:
      app: tigerbeetle
  template:
    metadata:
      labels:
        app: tigerbeetle
    spec:
      containers:
      - name: tigerbeetle
        image: ghcr.io/tigerbeetle/tigerbeetle:latest
        command: ["tigerbeetle", "start"]
        args: [
          "--addresses=$(TB_ADDRESSES)",
          "/data/$(TB_CLUSTER)_$(TB_REPLICA).tigerbeetle"
        ]
        ports:
        - containerPort: 3000
        volumeMounts:
        - name: data
          mountPath: /data
        env:
        - name: TB_CLUSTER
          value: "0"
        - name: TB_REPLICA
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: TB_ADDRESSES
          value: "tigerbeetle-0.tigerbeetle:3000,tigerbeetle-1.tigerbeetle:3000,tigerbeetle-2.tigerbeetle:3000"
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: tigerbeetle
spec:
  selector:
    app: tigerbeetle
  clusterIP: None
  ports:
  - port: 3000
```

## 5. CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: VAL Core CI/CD

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 18
    - run: npm ci
    - run: npm run build
    - run: npm run test:e2e

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    steps:
    - uses: actions/checkout@v4
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    - run: |
        docker build -t val-core:staging .
        docker tag val-core:staging ${{ secrets.ECR_REPO }}:staging
        aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_REPO }}
        docker push ${{ secrets.ECR_REPO }}:staging
    - run: |
        aws ecs update-service --cluster val-core-staging --service val-core-backend --force-new-deployment

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
    - uses: actions/checkout@v4
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    - run: |
        docker build -t val-core:latest .
        docker tag val-core:latest ${{ secrets.ECR_REPO }}:latest
        aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_REPO }}
        docker push ${{ secrets.ECR_REPO }}:latest
    - run: |
        aws ecs update-service --cluster val-core-production --service val-core-backend --force-new-deployment
```

## 6. Configuration Management

### Environment Variables
```bash
# Required for all environments
NODE_ENV=production
PORT=3001
ATTESTOR_PRIVATE_KEY=secure-key-from-vault
RPC_URL=https://mainnet.infura.io/v3/your-api-key

# Postgres
POSTGRES_URL=postgres://user:pass@host:port/db
PGHOST=database-host
PGPORT=5432
PGUSER=sovr_admin
PGPASSWORD=secure-password
PGDATABASE=sovr_narrative

# TigerBeetle
TB_CLUSTER_ID=0
TB_ADDRESS=10.0.1.10:3000,10.0.1.11:3000,10.0.1.12:3000

# External Adapters
SQUARE_API_KEY=square-api-key
SQUARE_LOCATION_ID=square-location-id
TANGO_PLATFORM_NAME=tango-platform
TANGO_PLATFORM_KEY=tango-key
TANGO_SANDBOX=false
INSTACART_UTID=instacart-utid
ARCUS_API_KEY=arcus-key
ARCUS_API_SECRET=arcus-secret
ARCUS_SANDBOX=false
MOOV_API_KEY=moov-key
MOOV_API_SECRET=moov-secret
MOOV_SANDBOX=false

# Monitoring
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
```

### Secret Management
- Use AWS Secrets Manager or HashiCorp Vault
- Rotate API keys/credentials quarterly
- Never commit secrets to version control

## 7. TigerBeetle Deployment Considerations

### Production Cluster Configuration
- **Quorum Size**: 3 replicas (for high availability)
- **Storage**: Dedicated NVMe SSDs (10GB minimum per replica)
- **Networking**: Low-latency, high-throughput network
- **OS Requirements**: Linux with kernel >= 5.10 (for io_uring)

### Performance Optimization
```bash
# Increase file descriptor limit
ulimit -n 65536

# Configure network settings
sysctl -w net.core.somaxconn=65535
sysctl -w net.ipv4.tcp_max_syn_backlog=65535
sysctl -w net.core.netdev_max_backlog=65535
```

### Backup Strategy
```bash
# Create TigerBeetle backup
tigerbeetle replicate --cluster=0 --replica=0 --addresses=10.0.1.10:3000 /data/0_0.tigerbeetle /backup/0_0.tigerbeetle

# Schedule nightly backups
0 2 * * * tigerbeetle replicate --cluster=0 --replica=0 --addresses=10.0.1.10:3000 /data/0_0.tigerbeetle /backup/0_0.tigerbeetle.$(date +%Y%m%d)
```

## 8. Security Best Practices

### Network Security
- **VPC Segmentation**: Separate tiers with security groups
- **Encryption**: Enable TLS 1.3 for all communication
- **Firewall**: Allow only necessary ports (3000, 3001, 5432, 5173)
- **VPN**: Require VPN for management access

### Application Security
- **Authentication**: Client-side signing with ethers.js, signature verification
- **Authorization**: Check recovered address against known admin list
- **Input Validation**: Validate all API inputs
- **Rate Limiting**: Implement per-user rate limits
- **CORS**: Restrict origins (avoid wildcard in production)

### Data Security
- **Encryption at Rest**: AES-256 for all storage
- **Encryption in Transit**: TLS for all communication
- **Key Management**: Hardware security module (HSM) for private keys
- **Audit Logs**: Centralized logging with retention policy

### Compliance
- **PCI DSS**: If handling card data (via Square/Stripe)
- **SOC 2**: For financial systems
- **GDPR**: If serving EU users
- **Logging**: Collect all API requests and system events

## 9. Monitoring & Observability

### Metrics Collection
- **Backend Metrics**: Prometheus + Express middleware
- **TigerBeetle Metrics**: Built-in metrics endpoint
- **Postgres Metrics**: pg_stat_statements for query performance
- **System Metrics**: Node exporter for CPU/memory/disk

### Logging
```bash
# Winston configuration
const winston = require('winston');
const CloudWatchTransport = require('winston-cloudwatch');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new CloudWatchTransport({
      logGroupName: '/aws/ecs/val-core',
      logStreamName: 'backend',
      awsRegion: 'us-east-1',
    }),
  ],
});
```

### Alerting
```yaml
# Prometheus Alertmanager configuration
route:
  receiver: 'slack'
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

receivers:
- name: 'slack'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/...'
    channel: '#ops'
    send_resolved: true
    icon_emoji: ':alert:'

alerts:
- alert: TigerBeetleConnectionFailure
  expr: rate(tigerbeetle_connection_errors[5m]) > 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: TigerBeetle connection errors
    description: '{{ $value }} connection errors in last 5 minutes'
```

## 10. Disaster Recovery

### Backup Schedule
- **TigerBeetle**: Nightly snapshots + continuous replication
- **PostgreSQL**: Automated backups + WAL archiving
- **Configuration**: Version control for all config files

### Recovery Process
1. Restore TigerBeetle cluster from latest snapshot
2. Restore PostgreSQL from backup
3. Deploy backend with fresh configuration
4. Verify system functionality with smoke tests
5. Monitor metrics and logs for anomalies

### Business Continuity
- Maintain hot standby cluster in different region
- Implement failover procedures
- Test recovery process quarterly

## 11. Performance Testing

### Load Testing Scenarios
1. **Spend Operations**: 1000 TPS for 1 hour
2. **Balance Queries**: 5000 TPS for 30 minutes
3. **Stress Testing**: 2000 TPS until failure

### Tools
- **k6**: API load testing
- **Locust**: User scenario testing
- **Grafana k6 Cloud**: Distributed load testing

## Conclusion

VAL Core is a sophisticated financial clearing protocol that requires careful deployment planning. By following this strategy, you can ensure a secure, reliable, and scalable production environment that adheres to the protocol's mechanical truth principles. The key is to prioritize TigerBeetle's infrastructure requirements, implement robust security measures, and establish comprehensive monitoring and recovery processes.
