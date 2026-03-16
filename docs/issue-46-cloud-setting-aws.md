# Cloud Setting (AWS)

**Issue #46** | **State:** OPEN | **Created:** 2026-01-14T07:50:12Z

**Assignees:** linked0

**Updated:** 2026-02-02T10:46:56Z | **Closed:** N/A

---

## Overview
With cooperation with @wingflower.
We should set the CICD pipeline to AWS and configure Docker image, RDS, EC instnaces, and etc.

Also consider these items.
- Integrate S3 Bucket for scalable image hosting.
- Ensure images survive container restarts (stateless architecture).
- Establish policy to maintain mvp, test, staging, prod branch (discuss with an expert like @wingflower )
- Cost Estimation: Analyze and summarize projected Gas fees and AWS infrastructure costs.

Additionally, we need to define a branching strategy that aligns with our testing, dev, staging, and production environments.

