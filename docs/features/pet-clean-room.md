# PET Data Clean Room — Homomorphic Encryption Study & PoC

**Goal:** understand how a PET (Privacy-Enhancing Technology) data clean room like DESILO's
works — analyze sensitive data (e.g. medical EMR) **while it stays encrypted**, exporting only
the result — and reproduce the core loop hands-on with open-source FHE libraries.

*Source: news article on DESILO (디사일로) supplying its "Data Clean Room" to the National
Cancer Center (국립암센터), pasted in session 2026-07-17 (조달청 2026 혁신제품 시범구매사업;
210-day pilot; no URL provided — this doc is the canonical copy of the summary).*

## 1. What the product actually is
- **Homomorphic encryption (HE):** compute directly on ciphertexts; only the final result is
  decrypted. Data originals never leave the provider.
- **Clean room shape:** two roles — **provider** (encrypts + holds the secret key) and
  **analyst/admin** (runs computations on ciphertexts, sees only approved outputs). DESILO
  ships exactly this split: 관리자용 1식 + 제공자용 1식 inside the cancer center's secure network.
- **Why it matters in Korea:** EMR/clinical data can't legally be exported or joined across
  institutions in raw form (개인정보보호법/의료법); HE sidesteps the export instead of the law.

## 2. PoC options (things jay can run directly, no partnership needed)

| # | PoC | Stack | What it proves |
|---|-----|-------|----------------|
| A | **Encrypted statistics** — mean/variance/correlation over a synthetic EMR-like CSV, computed on ciphertexts | **TenSEAL** or **Pyfhel** (Microsoft SEAL bindings, Python; CKKS scheme) | The core HE loop: encrypt → compute blind → decrypt result only |
| B | **Encrypted ML inference** — train a model in the clear, run **inference on encrypted patient rows**; sklearn's built-in **breast-cancer dataset** fits the cancer-center theme | **Zama Concrete ML** (scikit-learn-compatible FHE) | The realistic "analysis" a clean room sells; also shows the perf cost (FHE is 100–10,000× slower) |
| C | **Two-role clean-room simulation** — split A/B into two processes: `provider.py` (keygen + encrypt) and `analyst.py` (compute on ciphertexts, never sees the key); only the provider decrypts the returned result | same libs as A/B | The **trust architecture** — mirrors DESILO's 제공자/관리자 split, which is the actual product, not the math |
| D | *(stretch)* **Private set intersection** — find common "patients" between two synthetic hospital lists without revealing non-matches | a PSI library (e.g. OpenMined PSI) or a toy DH-based PSI | The **결합 (join)** step — clean rooms join data across institutions before analyzing |

**Suggested order: A → C → B** (D optional). A is a ~half-day intro; C turns it into a
clean-room demo; B makes it a story ("encrypted cancer-data inference"). Estimated total: 2–3
focused days for A+C+B.

## 3. Rabbit integration
- Surface: a demo page under **ETC** (alongside the ERC-7702/7715 demo) or **XYZ** — upload/
  pick a synthetic CSV → see it encrypted → run a stat or inference → only the result decrypts.
  Client-side is thin; the FHE work runs in a small Python service (Cloud Run job or local).
- Ties to [dsrv-portal.md](dsrv-portal.md): both are "regulated-data infrastructure" studies —
  DSRV covers custody of *assets*, this covers computation on *data*; together they sketch the
  compliance-tech (RegTech) angle.

## Status
Backlog / study item — not scheduled.
