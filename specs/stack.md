# Technical Stack Overview

This repository is an opinionated, full-stack TypeScript template optimized for modern cloud-native applications.  
The goal is to give coding agents and human contributors clear guidance on architecture, tooling, and conventions so they can focus on business logic rather than setup.

## 1. Runtime & Language

| Layer        | Primary Language | Rationale                                    |
|--------------|------------------|----------------------------------------------|
| Front-End    | TypeScript (React) | Static typing, rich ecosystem, DX           |
| Back-End     | TypeScript (NestJS) | Scalable, opinionated Node framework       |
| Infrastructure as Code | YAML / HCL | Declarative, reproducible environments      |

## 2. Front-End

- React 18 with Vite for ultra-fast HMR and build.  
- State management: Zustand (minimal) + React Query for server state.  
- Styling: Tailwind CSS + CSS Modules.  
- Form handling: React Hook Form + Zod for runtime validation.  
- Routing: React Router v6 (file-based routes planned).  
- Testing: Vitest + React Testing Library + Playwright (E2E).  

## 3. Back-End (API)

- NestJS 10 (Express adapter) with modular architecture.  
- CQRS & Dependency Injection baked in via Nest.  
- REST & GraphQL (Apollo) first-class support.  
- Validation: class-validator + class-transformer.  
- Authentication: Passport.js (JWT + OAuth strategies).  
- Authorization: CASL policies.  
- Testing: Jest (unit & integration), Supertest (HTTP).  

## 4. Data Layer

| Concern   | Technology                  | Notes                                   |
|-----------|-----------------------------|-----------------------------------------|
| RDBMS     | PostgreSQL 15               | Default relational store                |
| ORM       | Prisma ORM                  | Type-safe queries, DB migrations        |
| Caching   | Redis                       | Rate-limiting, session & query cache    |
| Search    | OpenSearch (optional)       | Full-text search & analytics            |

## 5. DevOps & Tooling

- Package manager: pnpm (workspaces).  
- Monorepo layout via Nx (task graph, affected-only builds).  
- Linting/Formatting: ESLint (Airbnb/Typescript) + Prettier.  
- Commit conventions: Conventional Commits + commitlint + Husky pre-commit.  
- Static code analysis: SonarCloud (optional).  
- Containerization: Docker (multi-stage, slim images).  
- CI: GitHub Actions (build, test, lint, security scan).  
- CD: GitHub Actions → Azure Container Registry → Azure Kubernetes Service.  

## 6. Infrastructure & Deployment

- IaC: Terraform modules for Azure (AKS, ACR, PostgreSQL Flexible Server, Redis Cache).  
- Cluster: Azure Kubernetes Service (1-click horizontal scaling).  
- Secrets: Azure Key Vault + CSI Driver.  
- Ingress: NGINX Ingress Controller + Cert-Manager (Let’s Encrypt).  
- Observability: OpenTelemetry, Prometheus, Grafana, Azure Monitor.  

## 7. Security Posture

1. Snyk scans in CI for dependencies.  
2. ESLint plugin-security for lint-time checks.  
3. OAuth 2.0 / OIDC flows when integrating external IdPs.  
4. Helmet & rate-limiting middleware enabled by default.  
5. Secrets never committed—use `dotenv-safe` locally, Key Vault in prod.  

## 8. Testing Strategy

- Unit: fast, isolated (Jest/Vitest).  
- Integration: DB & service contract tests (Jest + Testcontainers).  
- End-to-End: Playwright against PR environments.  
- Static: type-checking, linters, schema validation in CI pipeline.  

## 9. Local Development Workflow

```bash
# Install dependencies
pnpm i

# Spin up dev stack (DB, Redis) via docker-compose
pnpm dev:services

# Start front-end + back-end in parallel
pnpm dev
```

Hot-reload is enabled across the stack. Debugging presets are included for VS Code.

## 10. Contributing Guidelines (TL;DR)

1. Fork & branch from `main`.  
2. Follow Conventional Commit messages.  
3. Run `pnpm test` and `pnpm lint` before pushing.  
4. Open a PR—GitHub Actions will run the full pipeline.  

## 11. Extensibility Checklist

- Add a micro-frontend? Leverage Nx’s module federation plugin.  
- Swap DB? Prisma supports multiple providers; update schema & env vars.  
- Deploy serverless? NestJS can compile to Azure Functions—see `./deploy/azure-func`.  

## 12. Library & Runtime Versions

| Domain / Layer | Component | Pinned Version |
|----------------|-----------|----------------|
| **Core Runtime** | Node.js | 20 LTS (`20.11.x`) |
| | TypeScript | 5.3.x |
| | pnpm | 8.10.x |
| **Front-End** | React | 18.2.x |
| | Vite | 5.0.x |
| | Zustand | 4.4.x |
| | React Query | 5.21.x |
| | Tailwind CSS | 3.4.x |
| | React Hook Form | 7.45.x |
| | Zod | 3.22.x |
| | React Router | 6.14.x |
| | Vitest | 1.4.x |
| | Playwright | 1.42.x |
| **Back-End** | NestJS | 10.3.x |
| | Prisma ORM | 5.10.x |
| | class-validator | 0.14.x |
| | class-transformer | 0.5.x |
| | Passport.js | 0.7.x |
| | CASL | 6.6.x |
| | Jest | 29.7.x |
| | Supertest | 6.4.x |
| **Data Stores** | PostgreSQL | 15.4 |
| | Redis | 7.2 |
| | OpenSearch (opt.) | 2.12 |
| **DevOps / Tooling** | Docker Engine | 24.0.x |
| | Nx | 17.5.x |
| | ESLint | 8.55.x |
| | Prettier | 3.1.x |
| | Husky | 8.0.x |
| | commitlint | 17.8.x |
| **Infrastructure** | Terraform | 1.6.x |
| | Azure CLI (CI) | 2.54.x |
| | Kubernetes (AKS) | 1.28 |
| | NGINX Ingress Controller | 1.9.x |
| | Cert-Manager | 1.14.x |
| **Observability** | Prometheus | 2.47 |
| | Grafana | 10.2 |
| | OpenTelemetry Collector | 0.91 |

> All versions are defined in `package.json`, `Dockerfile`, or Terraform provider blocks and are kept up-to-date via Renovate bots and CI checks.

---

This document serves as a living reference; update it whenever the stack evolves.
