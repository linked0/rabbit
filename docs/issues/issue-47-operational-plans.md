# Operational Plans

**Issue #47** | **State:** OPEN | **Created:** 2026-01-14T07:51:48Z

**Assignees:** linked0

**Updated:** 2026-01-15T06:13:33Z | **Closed:** N/A

---

## Overview
- [ ] Database Migration Plan
  - [ ] Establish a comprehensive plan for database migrations to ensure operational stability.
- [ ] Admin Gas Fee Management Policy
  - [ ] Establish policies and methods for managing gas fees for admin operations.
  - [ ] Include management of trading gas fees (운용 가스비), etc.
- [ ] Operation Policy and Plan (운영 정책 및 계획 작성)
  - [ ] Establish comprehensive operation policies and execution plans.
- [ ] Infrastructure Evolution Strategy (인프라 고도화 전략)
  - [ ] Before V1.0 (Stabilization):
    - [ ] CI/CD Automation: Zero-downtime deployment for Cloud Run.
    - [ ] Async & Real-time: Redis Pub/Sub & Job Queue for matching result broadcasting and background tasks.
    - [ ] Database Security: Cloud SQL Auth Proxy & automated backup policies.
    - [ ] Observability: GCP Error Reporting & Centralized Logging setup.
  - [ ] After V1.0 (Scaling):
    - [ ] GKE (K8s): Transition for stateful scaling and fine-grained resource control.
    - [ ] Kafka: Evaluate for large-scale data streaming or complex event-driven silos.
-  [ ] Cloud Infrastructure & Dependency Management Policy:
  - [ ] Establish maintenance and governance policies for cloud environments (GCP/AWS).
  - [ ] Standardize npm package management, including version pinning, regular security audits, and dependency cleanup.
- [ ] Policy for deploying contracts and apply the deployment to the server

