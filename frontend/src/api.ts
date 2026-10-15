import {
  FleetStatusResponse,
  EquipmentRecord,
  SensorReading,
  DigitalTwinState,
  PredictiveAssessment,
  MaintenanceActivity,
  ModelUpdatePayload,
  ModelEvaluationResponse,
  PrivacyAuditEntry,
} from "./types";

const API_BASE = "/api";

export async function fetchFleetStatus(): Promise<FleetStatusResponse> {
  const res = await fetch(`${API_BASE}/fleet/status?_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch fleet status");
  return res.json();
}

export async function fetchAllMachines(): Promise<EquipmentRecord[]> {
  const res = await fetch(`${API_BASE}/machines`);
  if (!res.ok) throw new Error("Failed to fetch machines");
  return res.json();
}

export async function registerMachine(record: EquipmentRecord): Promise<any> {
  const res = await fetch(`${API_BASE}/machines/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function fetchMachineSensors(machineId: string): Promise<{
  machine_id: string;
  latest: SensorReading;
  history: SensorReading[];
  limits: any;
  abnormal_condition?: string | null;
}> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/sensors?_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch machine sensors");
  return res.json();
}

export async function controlSimulation(machineId: string, action: "start" | "pause" | "reset" | "step"): Promise<any> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/simulation/${action}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to ${action} simulation`);
  return res.json();
}

export async function injectAbnormalCondition(machineId: string, condition: string | null, severity: number = 0.7): Promise<any> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/inject-abnormal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ condition, severity }),
  });
  if (!res.ok) throw new Error("Failed to update abnormal condition");
  return res.json();
}

export async function fetchDigitalTwinState(machineId: string): Promise<DigitalTwinState> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/digital-twin?_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch digital twin");
  return res.json();
}

export async function calibrateDigitalTwin(machineId: string, notes: string): Promise<any> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/digital-twin/calibrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ technician_notes: notes }),
  });
  if (!res.ok) throw new Error("Calibration failed");
  return res.json();
}

export async function fetchPredictiveMaintenance(machineId: string): Promise<PredictiveAssessment> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/predictive-maintenance?_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch predictive assessment");
  return res.json();
}

export async function fetchMaintenanceRecords(machineId: string): Promise<MaintenanceActivity[]> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/maintenance?_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch maintenance records");
  return res.json();
}

export async function createMaintenanceActivity(machineId: string, record: MaintenanceActivity): Promise<any> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/maintenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to create maintenance activity");
  return res.json();
}

export async function updateMaintenanceActivity(machineId: string, recordId: string, updates: Partial<MaintenanceActivity>): Promise<any> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/maintenance/${recordId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update maintenance activity");
  return res.json();
}

export async function prepareLocalModelUpdate(machineId: string): Promise<{
  status: string;
  update: ModelUpdatePayload;
  certification: any;
}> {
  const res = await fetch(`${API_BASE}/machines/${machineId}/prepare-update`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Update preparation failed");
  }
  return res.json();
}

export async function fetchCoordinatorUpdates(): Promise<ModelUpdatePayload[]> {
  const res = await fetch(`${API_BASE}/coordinator/updates?_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch coordinator updates");
  return res.json();
}

export async function authorizeModelUpdate(updateId: string, approved: boolean, adminUser: string, reason: string): Promise<any> {
  const res = await fetch(`${API_BASE}/coordinator/authorize-update/${updateId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved, admin_user: adminUser, reason }),
  });
  if (!res.ok) throw new Error("Failed to authorize update");
  return res.json();
}

export async function executeFederatedAggregation(): Promise<any> {
  const res = await fetch(`${API_BASE}/coordinator/aggregate`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Aggregation failed");
  }
  return res.json();
}

export async function distributeSharedModel(): Promise<any> {
  const res = await fetch(`${API_BASE}/coordinator/distribute`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Distribution failed");
  return res.json();
}

export async function fetchModelEvaluation(): Promise<ModelEvaluationResponse> {
  const res = await fetch(`${API_BASE}/model/evaluation?_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch model evaluation");
  return res.json();
}

export async function fetchPrivacyAuditTrail(): Promise<{
  policy: any;
  audit_logs: PrivacyAuditEntry[];
  total_raw_samples_uploaded: number;
}> {
  const res = await fetch(`${API_BASE}/privacy/audit-trail?_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch privacy audit trail");
  return res.json();
}

export async function fetchScenarioState(): Promise<{ current_step: number; step_descriptions: string[] }> {
  const res = await fetch(`${API_BASE}/scenario/state?_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch scenario state");
  return res.json();
}

export async function executeScenarioStep(step: number): Promise<any> {
  const res = await fetch(`${API_BASE}/scenario/step/${step}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to execute scenario step ${step}`);
  return res.json();
}

export async function resetScenario(): Promise<any> {
  const res = await fetch(`${API_BASE}/scenario/reset`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset scenario");
  return res.json();
}
