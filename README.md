# Machine Pulse: Federated-Privacy Predictive Maintenance Platform for Manufacturing

## 1. Executive Summary

**Machine Pulse** is an interactive, privacy-preserving predictive maintenance simulation platform designed for industrial manufacturing environments. It demonstrates how:
1. **Equipment-Specific Digital Twins** model physics-informed nominal boundaries and residual deviations ($\Delta T, \Delta\text{Vib}, \Delta I, \Delta\text{RPM}$) for each independent physical asset.
2. **Decentralized Local Predictive Models** train locally at the machine edge using isolated operational telemetry and ground-truth maintenance logs.
3. **Central Federated Learning Coordinator** aggregates authorized parameter updates (via Federated Averaging / FedAvg) during maintenance cycles without ever receiving raw sensor time-series data.
4. **Data Governance & Privacy Guards** cryptographically certify that exactly 0 raw sensor bytes leave the machine boundary, preventing data leakage while continually improving fleet-wide failure prediction generalization.

---

## 2. Architecture & Architectural Guarantees

```
+---------------------------------------------------------------------------------------------------+
|                                  CENTRAL COORDINATOR DOMAIN                                       |
|                                                                                                   |
|  +------------------------------+     +-------------------------------+     +------------------+  |
|  |  Update Authorization Queue  | --> | FedAvg Aggregator (W_global)  | --> | Held-out Test    |  |
|  |  (Administrator Approval)   |     | W = sum(n_k / N * W_k)        |     | Validation Bench |  |
|  +------------------------------+     +-------------------------------+     +------------------+  |
|                 ^                                                                     |           |
|                 | Only Authorized Weight Tensors (312 Bytes)                          |           |
|                 | (Zero Raw Sensor Records Transmitted)                               |           |
+-----------------|---------------------------------------------------------------------|-----------+
                  |                                                                     v
  ================|=====================================================================|============
                  |                   ISOLATED EDGE MACHINE BOUNDARY                    |
  ================|=====================================================================|============
                  |                                                                     |
       [Certified Parameter Weights]                                     [Distributed Global Model]
                  |                                                                     |
  +---------------+---------------+                     +-------------------------------+---------------+
  | MOTOR A (MTR-001)             |                     | MOTOR B (MTR-002)                             |
  | • Feed Water Pump Motor       |                     | • Cooling Tower Fan Drive                     |
  | • Nominal Baseline            |                     | • Controlled Bearing Degradation Scenario     |
  | • Local Store: vault/MTR-001/ |                     | • Local Store: vault/MTR-002/                 |
  | • Twin: TWIN-MTR-001          |                     | • Twin: TWIN-MTR-002                          |
  | • Local Model: LMDL-MTR-001   |                     | • Local Model: LMDL-MTR-002                   |
  +-------------------------------+                     +-----------------------------------------------+
                  |
  +---------------+---------------+
  | MOTOR C (MTR-003)             |
  | • Reciprocating Compressor    |
  | • Heavy Variable Load Profile |
  | • Local Store: vault/MTR-003/ |
  | • Twin: TWIN-MTR-003          |
  | • Local Model: LMDL-MTR-003   |
  +-------------------------------+
```

### Mandatory Rules Enforced:
1. **Data Locality**: Raw operational sensor histories and detailed maintenance narratives stay exclusively in the machine's local vault directory (`backend/local_machine_vaults/{machine_id}/`).
2. **Star Topology**: No direct peer-to-peer communication between machines.
3. **Deep Packet Inspection**: Outbound update payloads are inspected for forbidden keys (`readings`, `time_series`, `waveform`) and verified to contain only the fixed $8 \times 4$ floating-point weight matrix and $4$-element bias vector.
4. **Reproducible Physics**: Motor dynamics follow standard electromechanical slip, $I^2R$ winding heating, and ISO 10816-3 vibration harmonics.

---

## 3. Technology Stack

- **Frontend**:
  - React 19 + TypeScript + Vite 8
  - Tailwind CSS v4 (Industrial Dark / Light theme, ISO color-coded risk alerts)
  - Recharts (Real-time vibration trends, thermal charts, multiclass failure mode distributions, ISO threshold reference lines)
  - Lucide React (Industrial engineering icons)
- **Backend**:
  - Python 3.14 + FastAPI + Starlette + Uvicorn
  - Pure Python linear algebra & numerical math (`math`, `random`) for 100% compliance with Windows Application Control (WDAC/AppLocker) policies.
  - Pydantic v2 schemas for all fleet, telemetry, digital twin, maintenance, and federated objects.
- **Testing**:
  - Comprehensive 12-test automated suite in `backend/tests/test_platform.py` validating all architectural guarantees.

---

## 4. Main Application Pages & Features

### A. Industrial Dashboard
- **Fleet KPI Metrics**: Total Registered Machines, Healthy Motors, Attention Required, Elevated Risk, Pending Maintenance, Pending FL Updates, Shared Model Version, Held-out Test Generalization F1-score.
- **Equipment Fleet Grid**: Real-time condition cards for Motor A, Motor B, and Motor C with health index gauges, live vibration RMS, temperature, current, and load factor.
- **Fleet Vibration Comparison Chart**: Multi-bar chart comparing live vibration velocities against ISO 10816-3 Zone B/C Warning ($2.8\text{ mm/s}$) and Zone C/D Trip ($4.5\text{ mm/s}$).

### B. Equipment Registry
- Pre-populated with 3 industrial induction motors:
  - **Motor A (MTR-001)**: ABB M3BP 280SMB 4 (75 kW, 400V, Deep Groove Ball 6316/C3, Class F).
  - **Motor B (MTR-002)**: Siemens 1LE1503-2BB23-4AA4 (55 kW, 400V, Cylindrical Roller NU 314, Class H).
  - **Motor C (MTR-003)**: WEG W22 Super Premium (90 kW, 400V, Spherical Roller 22218, Class F).
- Technical datasheet specifications, operating limits, documentation references, and local storage references.
- Interactive modal to register new equipment assets with dynamic edge twin provisioning.

### C. Equipment-Specific Digital Twin
- Individual digital twin views for each motor (`TWIN-MTR-001`, `TWIN-MTR-002`, `TWIN-MTR-003`).
- **Residual Deviations**: Real-time calculation of $\Delta\text{Vib}$, $\Delta T$, $\Delta I$, and $\Delta\text{RPM}$ against physics nominal models.
- **Tolerance Boundaries**: Full tolerance table with nominal expectations, lower/upper physics envelope, warning limits, and critical alarm thresholds.
- **Iterative Calibration**: Technician-triggered Bayesian/exponential smoothing calibration updating baseline vibration coefficients and thermal time constants ($\tau$).
- Calibration history audit trail table.

### D. Sensor Monitoring & Controlled Fault Injection
- Live telemetry cards: Vibration RMS, Vibration Peak-to-Peak (with impact crest factor), Stator RTD Temp, Current RMS, Rotor Speed (RPM), Load %, and 100% sensor availability indicator.
- Interactive Recharts time-series trends with ISO warning/critical threshold reference lines.
- **Controlled Industrial Fault Injection Panel**:
  - Inject Bearing Raceway Flaking (BPFO/BPFI defect with progressive acoustic vibration rise).
  - Inject Stator Winding Overheating (thermal buildup).
  - Inject Mechanical Unbalance ($1\times$ rotational speed harmonic vibration spike).
  - Restore Nominal Baseline.
  - Intensity severity slider ($20\%$ to $100\%$) and Step Forward simulation controller.

### E. Predictive Maintenance
- Health index score ($0-100\%$) and progress meter.
- Risk Category: **Low** (green), **Moderate** (yellow), **High** (orange), **Critical** (red).
- Numerical Failure Probability with 95% Confidence Interval ($[P_{lower}, P_{upper}]$).
- **Multiclass Failure Mode Distribution**:
  - Normal Operation
  - Bearing Raceway Fatigue / Wear
  - Stator Winding Overheating
  - Mechanical Imbalance / Misalignment
- Observed physical indicators and telemetry evidence explanation.

### F. Maintenance Management Workflow
- Select machine and review current condition.
- Log Maintenance Activities: Routine, Corrective, or Predictive Inspection.
- Fields: Technician name, observations, confirmed physical findings (e.g. bearing raceway flaking), actions taken, parts replaced.
- Stored directly into the machine's isolated edge storage vault.
- **Prepare Local Model Update Button**:
  - Executes local gradient descent training on newly labeled local operational window.
  - Extracts parameter weights delta (strictly no raw data).
  - Deep packet privacy certification: confirms 0 raw sensor bytes in transmission payload.
  - Submits update to Coordinator queue with status `Awaiting Authorization`.

### G. Central Federated Learning Coordinator
- **Authorization Queue**: Administrator review of submitted updates with sample count, training loss, validation accuracy, and SHA-256 checksum.
  - Administrator actions: **Approve** or **Reject**.
- **FedAvg Aggregation Station**:
  - Weighted averaging formula: $\mathbf{W}_{global} = \sum \frac{n_k}{N} \mathbf{W}_k$.
  - Executes FedAvg, bumps version ($v1.0.0 \rightarrow v1.1.0$), and measures pre- vs post-aggregation generalization on held-out test bench.
- **Distribution Station**:
  - One-click distribution of updated global model parameters back to fleet nodes.
  - Synchronizes fleet models while preserving local machine digital twins and private calibration data!

### H. Privacy & Data Governance Dashboard
- **Zero Raw Data Leakage Proof**: Confirmed $0\text{ raw samples}$ uploaded.
- **Interactive Data Locality Auditor**: Deep packet inspection displaying the exact JSON payload transmitted during federated learning ($\approx 312\text{ bytes}$ of weight matrices).
- Architectural data partitioning diagram (Edge Vault vs Central Coordinator).
- Immutable Audit Ledger tracking every registration, calibration, update submission, authorization, and aggregation event.

### I. Model Evaluation & Benchmark
- Held-out industrial test bench ($320\text{ independent test cycles}$ across 4 motor classes).
- Accuracy, Precision, Recall, F1-Score, False-Positive Rate (FPR), and Cross-Entropy Loss.
- $4 \times 4$ Multi-Class Confusion Matrix with True vs Predicted contingency cells.
- Binary metrics breakdown: True Positives (TP), False Positives (FP), True Negatives (TN), False Negatives (FN).
- Per-machine local model vs Central shared model performance comparison.

### J. 3-Motor Guided Walkthrough
- 10-Step Interactive Scenario Runner:
  1. Initialize 3 Motors & Digital Twins
  2. Stream Nominal Baseline Telemetry
  3. Inject Controlled Bearing Degradation into Motor B
  4. Digital Twin Residual Anomaly Detection
  5. Local Predictive Model Flags Elevated Risk
  6. Technician Logs Corrective Maintenance & Bearing Replacement
  7. Local Model Trains & Prepares Certified Update
  8. System Admin Authorizes Model Update
  9. Coordinator Executes Federated Averaging (FedAvg)
  10. Distribute Shared Model Across Fleet
- Step forward, step back, and Reset Scenario buttons.

---

## 5. Setup & Execution Instructions

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+)

### Running the Backend
From the project root:
```bash
# Activate virtual environment
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/macOS

# Start FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
The backend serves both the API endpoints (`/api/...`) and the compiled frontend at `http://127.0.0.1:8000/`.

### Running the Frontend in Development Mode (Vite)
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173/` in your browser.

### Running Automated Test Suite
From the project root:
```bash
python -m backend.tests.test_platform
```

---

## 6. Implementation Status Matrix

| Requirement Area | Implementation Status | Notes |
| :--- | :---: | :--- |
| **Independent Digital Twins** | **Fully Implemented** | Physics-grounded expected ranges, residual calculations, iterative calibration. |
| **Isolated Local Data Storage** | **Fully Implemented** | Independent vault directories per machine; raw sensor data remains 100% local. |
| **Local ML Training** | **Fully Implemented** | Pure Python multiclass neural softmax model with genuine local gradient descent. |
| **Controlled Fault Injection** | **Fully Implemented** | Bearing fault, thermal overload, and imbalance with differential physics progression. |
| **Privacy Certification** | **Fully Implemented** | Deep packet inspector verifies zero raw sensor arrays; SHA-256 checksum generated. |
| **Federated Coordinator (FedAvg)** | **Fully Implemented** | Sample-weighted tensor averaging, authorization queue, versioning ($v1.0.0 \rightarrow v1.1.0$). |
| **Model Distribution** | **Fully Implemented** | Star topology distribution synchronizes local models while preserving twin states. |
| **Held-out Model Evaluation** | **Fully Implemented** | Empirical 320-sample validation bench, $4 \times 4$ confusion matrix, precision/recall/F1/FPR. |
| **3-Motor Scenario Walkthrough**| **Fully Implemented** | 10-step guided stepper with reset and jump-to-step controls. |
| **Role-Aware UI** | **Fully Implemented** | Plant Manager, Maintenance Technician, and System Administrator simulated roles. |
