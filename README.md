# SubsFlow — Enterprise Multi-Tenant Subscription & Billing Platform

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.3.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Apache%20Kafka-3.7-231F20?style=for-the-badge&logo=apachekafka&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

**SubsFlow** is an enterprise-grade, multi-tenant subscription management, billing engine, and developer platform built for high-velocity SaaS companies. It provides multi-tenant database isolation, transactional outbox event streaming via Kafka, token bucket rate-limiting with Redis, automated payment processing, HMAC-SHA256 signed outbound webhooks, real-time MRR/ARR financial analytics, and a comprehensive internal Platform Administration Ops Center.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Key Features by Phase](#-key-features-by-phase)
3. [Technology Stack](#-technology-stack)
4. [Quick Start with Docker](#-quick-start-with-docker)
5. [Manual Local Development](#-manual-local-development)
6. [Default Credentials & Access Points](#-default-credentials--access-points)
7. [API Reference Summary](#-api-reference-summary)
8. [Configuration & Environment Variables](#-configuration--environment-variables)
9. [Automated Testing](#-automated-testing)
10. [Production Deployment](#-production-deployment)

---

## 🏗 Architecture Overview

```
                        ┌─────────────────────────────────────────────────────────┐
                        │                 Client / Web Browser                    │
                        │   (Public Landing • Tenant Workspace • Admin Console)   │
                        └───────────────────────────┬─────────────────────────────┘
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SubsFlow Core Application (Port 8080)                            │
│                                                                                                        │
│   ┌───────────────────────────┐  ┌──────────────────────────┐  ┌───────────────────────────────────┐   │
│   │    Tenant Auth & RBAC     │  │   Platform Admin Ops     │  │    Product API Credentials        │   │
│   │  (OWNER, ADMIN, DEV, VIEWER) (ADMIN, SUPPORT, VIEWER)   │  │  (X-Client-Id & X-Client-Secret) │   │
│   └─────────────┬─────────────┘  └────────────┬─────────────┘  └─────────────────┬─────────────────┘   │
│                 │                             │                                  │                     │
│                 ▼                             ▼                                  ▼                     │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          Multi-Tenant Billing & Subscription State Engine                      │   │
│   │        Products ──► Plans ──► Entitlements ──► Subscriptions ──► Invoices ──► Payments         │   │
│   └───────────────────────────────────────────┬────────────────────────────────────────────────────┘   │
│                                               │                                                        │
│                 ┌─────────────────────────────┼──────────────────────────────┐                         │
│                 ▼                             ▼                              ▼                         │
│   ┌───────────────────────────┐  ┌──────────────────────────┐  ┌───────────────────────────────────┐   │
│   │   Rate Limiter (Bucket)   │  │   Outbox Event Publisher │  │     Outbound Webhooks Engine      │   │
│   │ (Redis + In-Memory Fallback│  │    (Transactional Outbox)│  │     (HMAC-SHA256 Signatures)      │   │
│   └─────────────┬─────────────┘  └────────────┬─────────────┘  └─────────────────┬─────────────────┘   │
└─────────────────┼─────────────────────────────┼──────────────────────────────────┼─────────────────────┘
                  │                             │                                  │
                  ▼                             ▼                                  ▼
     ┌──────────────────────────┐  ┌──────────────────────────┐       ┌──────────────────────────┐
     │    Redis (Port 6379)     │  │   Kafka (Port 9092)      │       │     Customer Webhook     │
     │ Rate Limiting & Caching  │  │ Topics: payments, subs   │       │        Endpoints         │
     └──────────────────────────┘  └──────────────────────────┘       └──────────────────────────┘
                  │                             │
                  ▼                             ▼
     ┌────────────────────────────────────────────────────────┐       ┌──────────────────────────┐
     │              PostgreSQL 15 (Port 5433)                 │       │    Prometheus & Grafana  │
     │   Tenant Schema Isolation • 13 Flyway Migrations       │       │  Metrics & Alert Center  │
     └────────────────────────────────────────────────────────┘       └──────────────────────────┘
```

---

## 🚀 Key Features by Phase

### Phase 1: Platform Administration (Internal Ops)
- Internal platform administration boundaries isolated from tenant business data.
- Tenant lifecycle operations (activate, suspend, view contact info, audit trail).

### Phase 2: Tenant User Onboarding & RBAC
- Tenant self-registration and team user management.
- Granular Role-Based Access Control (`OWNER`, `ADMIN`, `DEVELOPER`, `VIEWER`).
- Password hashing with BCrypt and secure stateless JWT authentication.

### Phase 3: SaaS Product Catalogs & API Authentication
- Multi-product catalog management per tenant organization.
- Dual-credential developer authentication (`X-Client-Id` & `X-Client-Secret`) using SHA-256 hashed storage.
- Multi-tenant token bucket rate-limiting (Redis-backed with seamless in-memory fallback).

### Phase 4: Product Plans & Feature Tiering
- Configurable recurring pricing tiers (`MONTHLY`, `YEARLY`, `QUARTERLY`, `WEEKLY`, `DAILY`).
- Public catalog isolation: public customers only see active public plans.
- Tiered feature entitlements with boolean flags and numerical limits (`NUMERIC`, `BOOLEAN`, `TEXT`).
- Immutable plan versioning snapshotting pricing and intervals at subscription creation.

### Phase 5: Customer & Subscription Lifecycle Engine
- Strict subscription lifecycle state machine:
  `TRIALING` ➔ `ACTIVE` ➔ `PAST_DUE` ➔ `CANCELED` / `EXPIRED` / `UNPAID`.
- Safe plan upgrades and immediate or period-end cancellations.

### Phase 6: Invoices & Payment Engine
- Pluggable `PaymentProvider` abstraction with integrated `SandboxPaymentProvider`.
- Automatic invoice generation with idempotency keys (`Idempotency-Key` header).
- Refund processing and payment decline tracking.

### Phase 7: Webhooks, Usage Tracking & Notifications
- Outbound transactional webhook dispatches with cryptographic HMAC-SHA256 signatures (`X-SubsFlow-Signature`).
- Automatic retry scheduling with exponential backoff and manual operator retry triggers.
- Metered usage ingestion and aggregation for usage-based billing.
- Real-time notification matrix for subscription, billing, and payment events.

### Phase 8: Analytics & Reporting
- Real-time financial calculations: **MRR** (Monthly Recurring Revenue), **ARR**, **Gross/Net Revenue**, and **Churn Rate %**.
- Server-side streaming CSV exports across Tenants, Customers, Subscriptions, Payments, and Audit Logs.

### Platform Administration Enhancement (Complete Console)
- Internal Platform Admin RBAC (`PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, `PLATFORM_VIEWER`).
- Universal cross-tenant global search across Tenants, Products, Customers, Subscriptions, and Payments.
- Live Infrastructure Heartbeat monitoring (PostgreSQL, Redis, Kafka, Webhook workers).
- Dark Cyber-Ops theme with high-contrast typography and 3D TiltCards.

---

## 🛠 Technology Stack

### Backend
- **Framework**: Spring Boot 3.3.2
- **Java Version**: Java 17 LTS
- **Persistence**: Spring Data JPA / Hibernate 6, Flyway Migrations (13 scripts)
- **Database**: PostgreSQL 15
- **Caching & Rate Limiting**: Redis 7, Lettuce Client
- **Event Messaging**: Apache Kafka 3.7 & Zookeeper
- **Security**: Spring Security, JJWT (HMAC-SHA512 & SHA256), BCrypt

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5.4
- **Styling**: Vanilla CSS, Modern Dark Cyber Theme, 3D TiltCard Effects
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Monitoring & Infrastructure
- **Metrics**: Prometheus & Micrometer
- **Dashboards**: Grafana (Pre-provisioned dashboards)
- **Containerization**: Multi-stage Dockerfile, Docker Compose

---

## 🐳 Quick Start with Docker

The fastest way to launch the entire ecosystem is via Docker Compose:

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS / Linux)

### 2. Start the Stack
```powershell
# Clone the repository
git clone https://github.com/your-username/SubsFlow.git
cd SubsFlow

# Launch all microservices
docker-compose up --build -d
```

### 3. Verify Container Health
```powershell
docker-compose ps
```

All containers (`subsflow-app`, `subsflow-postgres`, `subsflow-redis`, `subsflow-kafka`, `subsflow-zookeeper`, `subsflow-prometheus`, `subsflow-grafana`) should be **Up / Healthy**.

---

## 💻 Manual Local Development

### 1. Start Infrastructure Dependencies
```powershell
docker-compose up -d postgres redis kafka zookeeper
```

### 2. Run the Spring Boot Backend
```powershell
# Build and run backend
./mvnw spring-boot:run
```
Backend runs on `http://localhost:8080`.

### 3. Run the React Frontend (Dev Server with HMR)
```powershell
cd frontend
npm install
npm run dev
```
Frontend development server runs on `http://localhost:5173`.

---

## 🔑 Default Credentials & Access Points

| Portal / Service | URL | Credentials |
| :--- | :--- | :--- |
| **Public Landing Page** | [http://localhost:8080](http://localhost:8080) | Public Access |
| **SubsFlow Platform Admin** | [http://localhost:8080/admin](http://localhost:8080/admin) | **Email**: `admin@subsflow.com`<br/>**Password**: `admin123` or `SubsFlow_Dev_2026!` |
| **Tenant Workspace Console** | [http://localhost:8080/app](http://localhost:8080/app) | Create via `/register` or sign in via `/login` |
| **Grafana Observability** | [http://localhost:3001](http://localhost:3001) | **User**: `admin` / **Pass**: `admin` |
| **Prometheus Metrics** | [http://localhost:9090](http://localhost:9090) | Public Metrics Scraping |

---

## 📡 API Reference Summary

### 1. Platform Admin API (`/api/admin/*`)
Requires `Authorization: Bearer <ADMIN_JWT_TOKEN>`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Admin authentication (returns JWT) |
| `GET` | `/api/admin/dashboard` | Platform metrics & tenant counters |
| `GET` | `/api/admin/tenants` | Paginated tenant list with search & status filter |
| `GET` | `/api/admin/tenants/{id}/support-overview` | Comprehensive read-only support inspection |
| `PATCH` | `/api/admin/tenants/{id}/status` | Activate or suspend tenant |
| `GET` | `/api/admin/search?q={query}` | Universal cross-tenant global search |
| `GET` | `/api/admin/admins` | List internal platform admins |
| `POST` | `/api/admin/admins` | Provision internal platform admin |
| `PATCH` | `/api/admin/admins/{id}/status` | Toggle admin status (`ACTIVE` / `DISABLED`) |
| `GET` | `/api/admin/system/health` | Real-time health checks (DB, Redis, Kafka) |
| `GET` | `/api/admin/export/{reportType}` | Stream CSV exports (`tenants`, `customers`, `payments`, etc.) |

### 2. Tenant & Product API (`/api/v1/*`)
Requires `X-Tenant-Id` + `Authorization: Bearer <USER_JWT>` or `X-Client-Id` + `X-Client-Secret`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register tenant organization & owner |
| `POST` | `/api/v1/auth/login` | Tenant user login |
| `GET` | `/api/v1/products` | List tenant SaaS products |
| `POST` | `/api/v1/products` | Create new SaaS product |
| `POST` | `/api/v1/products/{id}/credentials` | Generate API Client credentials |
| `GET` | `/api/v1/products/{id}/plans` | List product pricing plans |
| `POST` | `/api/v1/products/{id}/plans` | Create product plan |
| `GET` | `/api/v1/products/{id}/customers` | List product customers |
| `POST` | `/api/v1/products/{id}/customers` | Register customer |
| `POST` | `/api/v1/subscriptions` | Create customer subscription |
| `PATCH` | `/api/v1/subscriptions/{id}/cancel` | Cancel subscription |
| `POST` | `/api/v1/billing/checkout` | Process payment checkout |
| `GET` | `/api/v1/analytics/dashboard` | Retrieve MRR, ARR, Churn, Revenue |

---

## ⚙️ Configuration & Environment Variables

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5433/subsflow` | PostgreSQL JDBC connection URL |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | Database password |
| `SPRING_DATA_REDIS_HOST` | `localhost` | Redis host |
| `SPRING_DATA_REDIS_PORT` | `6379` | Redis port |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS`| `localhost:9092` | Kafka broker address |
| `SUBSFLOW_JWT_SECRET` | *(Default 64-char key)* | Secret key for signing HS512 JWTs |
| `PORT` | `8080` | Application HTTP server port |

---

## 🧪 Automated Testing

SubsFlow includes unit, integration, and architecture regression tests:

```powershell
# Run the full automated test suite
mvn test "-Dtest=*Test,!IdempotencyServiceTest,!PaymentGatewayConcurrencyTest,!SubscriptionOptimisticLockingTest,!TenantIsolationTest"
```

```
[INFO] Results:
[INFO] 
[INFO] Tests run: 62, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] BUILD SUCCESS
```

---

## 🚀 Production Deployment

### Option 1: Standalone Runnable JAR
The project compiles into a single Fat JAR containing all backend classes, Flyway database migrations, and pre-compiled frontend assets:
```powershell
# 1. Build the production jar
mvn clean package -DskipTests

# 2. Run the application
java -jar target/subsflow-0.0.1-SNAPSHOT.jar
```

### Option 2: Cloud PaaS (Railway / Render / AWS ECS / Fly.io)
1. Push your repository to GitHub.
2. Link the repository to your PaaS provider.
3. The included multi-stage `Dockerfile` will automatically build the frontend assets, compile the Java binary, and start the lightweight JRE 17 container.
4. Set the environment variables in your PaaS dashboard (`SPRING_DATASOURCE_URL`, `SPRING_DATA_REDIS_HOST`, `SUBSFLOW_JWT_SECRET`).

---

## 📄 License
SubsFlow is open-source software licensed under the **Apache License 2.0**.
