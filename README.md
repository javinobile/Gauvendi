# GauVendi Project Setup Guide

This guide explains how to set up and run the GauVendi microservices environment locally.

## 1. Prerequisites
- **Node.js** (v18+)
- **npm**
- **Docker** & **Docker Compose**
- **PostgreSQL** client (optional, for DB verification)

## 2. Infrastructure Setup (Docker)
The project relies on several infrastructure services (Postgres, Redis, RabbitMQ, Kafka, Zookeeper, Mongo).

1.  Navigate to the project root where `docker-compose.yml` is located.
2.  Start the containers:
    ```bash
    docker-compose up -d
    ```
3.  Verify all containers are running:
    ```bash
    docker ps
    ```

## 3. Environment Configuration (.env)
Ensure each service has its `.env` file configured.

### `gauvendi-platform-service-v2/.env`
Create this file if it doesn't exist. Critical setting for local dev without OpenAI key:
```env
PORT=3001
RMQ_URL=amqp://guest:guest@localhost:5672
RMQ_QUEUE=platform_queue
MAX_WORKERS=1
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gauvendi_platform
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DATABASE=gauvendi_history
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
# DISABLE AI SCORING FOR LOCAL DEV
IS_USE_AI_FOR_SCORE=false
```

### `gauvendi-service-ise-v2/.env`
```env
PORT=3002
RMQ_URL=amqp://guest:guest@localhost:5672
ISE_RMQ_QUEUE=ise_queue
RMQ_ISE_SOCKET_QUEUE=ise_socket_queue
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gauvendi_ise
KAFKA_BROKERS=localhost:9092
```

### `gauvendi-api-gateway/.env`
(Standard default configuration, ensure it points to local services if needed, usually defaults work).

### `gauvendi-ui-ise/src/environments/environment.ts`
Ensure the `graphqlUrl` points to the local API Gateway proxy to handle CORS/Remote GraphQL:
```typescript
export const environment = {
  // ... other configs
  apiURL: 'http://localhost:3000', // Points to local Gateway
  graphqlUrl: 'http://localhost:3000/api/graphql', // IMPORTANT: Points to local proxy
  // ...
};
```

## 4. Running the Services
Open separate terminals for each service and start them in this order:

### 1. Platform Service (Backend Logic)
```bash
cd gauvendi-platform-service-v2
npm install
npm run start:dev
```
*Port: 3001*

### 2. ISE Service (Backend Logic)
```bash
cd gauvendi-service-ise-v2
npm install
npm run start:dev
```
*Port: 3002*

### 3. API Gateway (Entry Point & Proxy)
The Gateway proxies requests to backend services and handles the GraphQL connection to the remote server (Sandbox/QA).
```bash
cd gauvendi-api-gateway
npm install
npm run start:dev
```
*Port: 3000*
**Note:** If you see certificate errors in logs, the `GraphqlProxyController` is configured to bypass SSL verification for development.

### 4. Frontend (UI)
```bash
cd gauvendi-ui-ise
npm install
npm start
```
*Port: 4202*

## 5. Accessing the Application
Once all services are running, access the application at:

👉 **http://localhost:4202/GV000001**

*   `GV000001` is the hotel code created by the seed script.
*   The default `TEST_HOTEL` code in some scripts is invalid for the frontend validator.

## 6. Troubleshooting

### GraphQL Errors (404/500/CORS)
*   The project does **not** have a local GraphQL server.
*   The frontend is configured to use the **API Gateway Proxy** (`http://localhost:3000/api/graphql`).
*   The API Gateway forwards these requests to a **Remote GraphQL Service** (e.g., Sandbox or QA).
*   If the remote service is down (503/404), features depending on GraphQL will fail.

### OpenAI Errors
If `gauvendi-platform-service-v2` crashes on startup complaining about OpenAI keys:
*   Ensure `IS_USE_AI_FOR_SCORE=false` is set in its `.env` file.

### Database/Migration Errors
*   Ensure Postgres is running (`docker-compose up`).
*   Check that migrations have run:
    ```bash
    # In platform-service
    npx typeorm migration:run -d src/core/database/data-source.ts
    ```
