"""
Federated-Privacy Machine Pulse Backend API.
Built with FastAPI.
Implements:
- 3 independent simulated industrial motors (Motor A, Motor B, Motor C)
- Machine-specific digital twins
- Isolated local storage per machine
- Local predictive model training & inference
- Central federated learning coordinator (FedAvg)
- Privacy & data governance audit trail
- Held-out test evaluation
- End-to-end 3-machine interactive demonstration scenario
"""
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
import time
import os
import uuid

from backend.models import (
    EquipmentRecord, TechnicalSpecs, OperatingLimits, SensorReading,
    DigitalTwinState, PredictiveAssessment, MaintenanceActivity,
    ModelUpdatePayload, FederatedRound, PrivacyAuditEntry
)
from backend.simulation.motor_simulation import MotorSimulator
from backend.simulation.digital_twin import EquipmentDigitalTwin
from backend.storage.machine_store import LocalMachineStore
from backend.ml.local_model import LocalPredictiveModel
from backend.ml.federated_coordinator import FederatedCoordinator
from backend.data_governance.privacy_guard import PrivacyGovernanceManager

app = FastAPI(
    title="Federated-Privacy Machine Pulse API",
    description="Privacy-Preserving Predictive Maintenance Platform with Equipment Digital Twins & Federated Learning",
    version="1.0.0"
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Central Coordinator & Privacy Guard Singletons
coordinator = FederatedCoordinator()
privacy_guard = PrivacyGovernanceManager()

# Registry and State per Machine
# Enforces: Each machine maintains its own digital twin, local data store, and local model
class MachineNode:
    def __init__(
        self,
        record: EquipmentRecord,
        seed: int = 42
    ):
        self.record = record
        self.simulator = MotorSimulator(
            machine_id=record.machine_id,
            rated_power_kw=record.technical_specs.rated_power_kw,
            rated_voltage_v=record.technical_specs.rated_voltage_v,
            rated_current_a=record.technical_specs.rated_current_a,
            rated_speed_rpm=record.technical_specs.rated_speed_rpm,
            poles=record.technical_specs.poles,
            seed=seed
        )
        self.digital_twin = EquipmentDigitalTwin(
            machine_id=record.machine_id,
            twin_id=record.twin_id,
            specs=record.technical_specs,
            limits=record.operating_limits,
            installation_date=record.installation_date
        )
        self.local_store = LocalMachineStore(machine_id=record.machine_id)
        self.local_model = LocalPredictiveModel(
            machine_id=record.machine_id,
            version=record.current_local_model_version
        )
        self.latest_reading: Optional[SensorReading] = None
        self.latest_twin_state: Optional[DigitalTwinState] = None
        self.latest_assessment: Optional[PredictiveAssessment] = None

        # Pre-populate some historical local readings
        self._bootstrap_local_history()

    def _bootstrap_local_history(self):
        for _ in range(30):
            r = self.simulator.step(1.0)
            self.local_store.append_sensor_reading(r)
        self.latest_reading = r
        self.latest_twin_state = self.digital_twin.evaluate_state(r)
        self._refresh_prediction()

    def step(self) -> SensorReading:
        r = self.simulator.step(1.0)
        self.latest_reading = r
        self.local_store.append_sensor_reading(r)
        self.latest_twin_state = self.digital_twin.evaluate_state(r)
        self._refresh_prediction()
        return r

    def _refresh_prediction(self):
        if not self.latest_reading or not self.latest_twin_state:
            return
        pred = self.local_model.predict(
            self.latest_reading.model_dump(),
            self.latest_twin_state.residual_deviations
        )
        self.latest_assessment = PredictiveAssessment(
            machine_id=self.record.machine_id,
            timestamp=self.latest_reading.timestamp,
            health_index=pred["health_index"],
            risk_category=pred["risk_category"],
            numerical_risk_score=pred["numerical_risk_score"],
            confidence_interval=pred["confidence_interval"],
            observed_indicators=pred["observed_indicators"],
            potential_failure_modes=pred["potential_failure_modes"],
            recommended_priority=pred["recommended_priority"],
            model_version=pred["model_version"],
            explanation=pred["explanation"]
        )
        # Update current status
        if pred["risk_category"] == "Critical":
            self.record.current_status = "Critical"
        elif pred["risk_category"] == "High":
            self.record.current_status = "Warning"
        elif pred["risk_category"] == "Moderate":
            self.record.current_status = "Attention Required"
        else:
            self.record.current_status = "Operational"


# Global Fleet Registry Map
FLEET: Dict[str, MachineNode] = {}

def initialize_default_motors():
    FLEET.clear()
    
    # Motor A: Normal operating baseline
    motor_a = EquipmentRecord(
        machine_id="MTR-001",
        name="Feed Water Pump Motor A",
        category="Industrial Electric Motor",
        manufacturer="ABB Automation",
        model_number="M3BP 280SMB 4",
        technical_specs=TechnicalSpecs(
            rated_power_kw=75.0,
            rated_voltage_v=400.0,
            rated_current_a=135.0,
            rated_speed_rpm=1485.0,
            poles=4,
            bearing_type="Deep Groove Ball 6316/C3",
            insulation_class="Class F (155°C max)"
        ),
        operating_limits=OperatingLimits(
            max_temperature_c=90.0,
            warning_temperature_c=78.0,
            max_vibration_rms_mms=4.5,
            warning_vibration_rms_mms=2.8,
            max_current_a=150.0
        ),
        installation_date="2023-03-15",
        datasheet_reference="DOC-ABB-M3BP-280-REV4.pdf",
        historical_data_reference="LOCAL_VAULT://MTR-001/history_2023_2025.db",
        sensor_configuration=["Triaxial Accelerometer", "PT100 Stator RTD", "Hall-effect Current Transducer", "Optical Tachometer"],
        current_status="Operational",
        last_maintenance_date="2026-08-10",
        twin_id="TWIN-MTR-001",
        local_model_id="LMDL-MTR-001",
        current_local_model_version="v1.0.0"
    )
    
    # Motor B: Gradual bearing raceway degradation scenario
    motor_b = EquipmentRecord(
        machine_id="MTR-002",
        name="Cooling Tower Fan Drive B",
        category="Industrial Electric Motor",
        manufacturer="Siemens Energy",
        model_number="1LE1503-2BB23-4AA4",
        technical_specs=TechnicalSpecs(
            rated_power_kw=55.0,
            rated_voltage_v=400.0,
            rated_current_a=100.0,
            rated_speed_rpm=1480.0,
            poles=4,
            bearing_type="Cylindrical Roller NU 314",
            insulation_class="Class H (180°C max)"
        ),
        operating_limits=OperatingLimits(
            max_temperature_c=88.0,
            warning_temperature_c=75.0,
            max_vibration_rms_mms=4.5,
            warning_vibration_rms_mms=2.8,
            max_current_a=115.0
        ),
        installation_date="2022-11-20",
        datasheet_reference="DOC-SIE-1LE1503-MANUAL.pdf",
        historical_data_reference="LOCAL_VAULT://MTR-002/history_2022_2025.db",
        sensor_configuration=["Piezoelectric Accelerometer", "Thermocouple Type K", "CT Current Sensor", "Proximity Probe"],
        current_status="Operational",
        last_maintenance_date="2026-06-04",
        twin_id="TWIN-MTR-002",
        local_model_id="LMDL-MTR-002",
        current_local_model_version="v1.0.0"
    )
    
    # Motor C: High variable load compressor motor
    motor_c = EquipmentRecord(
        machine_id="MTR-003",
        name="Reciprocating Compressor Motor C",
        category="Industrial Electric Motor",
        manufacturer="WEG Industries",
        model_number="W22 Super Premium 90kW",
        technical_specs=TechnicalSpecs(
            rated_power_kw=90.0,
            rated_voltage_v=400.0,
            rated_current_a=162.0,
            rated_speed_rpm=1488.0,
            poles=4,
            bearing_type="Spherical Roller 22218",
            insulation_class="Class F (155°C max)"
        ),
        operating_limits=OperatingLimits(
            max_temperature_c=95.0,
            warning_temperature_c=82.0,
            max_vibration_rms_mms=5.0,
            warning_vibration_rms_mms=3.0,
            max_current_a=185.0
        ),
        installation_date="2024-01-10",
        datasheet_reference="DOC-WEG-W22-PREMIUM-SPECS.pdf",
        historical_data_reference="LOCAL_VAULT://MTR-003/history_2024_2025.db",
        sensor_configuration=["MEMS Vibration Node", "PT100 Winding RTD", "Rogowski Coil 3-Phase", "Magnetic Encoder"],
        current_status="Operational",
        last_maintenance_date="2026-09-18",
        twin_id="TWIN-MTR-003",
        local_model_id="LMDL-MTR-003",
        current_local_model_version="v1.0.0"
    )

    FLEET["MTR-001"] = MachineNode(motor_a, seed=101)
    FLEET["MTR-002"] = MachineNode(motor_b, seed=202)
    FLEET["MTR-003"] = MachineNode(motor_c, seed=303)

    # Seed initial maintenance record for Motor C
    FLEET["MTR-003"].local_store.add_maintenance_record(MaintenanceActivity(
        id="MAINT-PREV-001",
        machine_id="MTR-003",
        activity_type="Routine",
        status="Completed",
        created_at="2026-09-18 09:30:00",
        completed_at="2026-09-18 11:45:00",
        technician_name="J. Ramirez (Cert L3)",
        observations="Semi-annual lubrication replenishment and coupling alignment check.",
        confirmed_findings="Coupling offset within 0.03mm. Synthetic grease renewed in drive-end bearing.",
        actions_taken="Regreased with 35g Kluberplex BEM 34-132. Re-torqued foundation bolts.",
        operating_hours_at_service=8420.0,
        parts_replaced=["Grease seals", "V-ring deflector"],
        local_update_eligible=False
    ))

initialize_default_motors()

# Scenario Stepper State
SCENARIO_STATE = {
    "current_step": 0,
    "step_descriptions": [
        "1. Registered three industrial motors with independent digital twins.",
        "2. Continuous sensor streaming active; nominal baseline observed.",
        "3. Controlled bearing raceway defect injected into Motor B.",
        "4. Motor B's digital twin identifies vibration residual anomaly (+3.2 mm/s).",
        "5. Local predictive model flags Motor B with Elevated Failure Risk (84% Bearing Wear).",
        "6. Technician logs corrective maintenance & confirmed bearing flaking.",
        "7. Local model trains on newly labeled data & prepares certified parameter update.",
        "8. System Admin inspects data locality & approves the model update payload.",
        "9. Central Coordinator executes Federated Averaging (FedAvg) and validates on held-out test bench.",
        "10. New model version (v1.1.0) distributed across fleet without raw data sharing!"
    ]
}

# --- FLEET & DASHBOARD ENDPOINTS ---

@app.get("/api/fleet/status")
def get_fleet_status():
    total = len(FLEET)
    healthy = 0
    attention = 0
    elevated_risk = 0
    
    machines_summary = []
    for m_id, node in FLEET.items():
        node.step()
        risk = node.latest_assessment.risk_category if node.latest_assessment else "Low"
        if risk == "Low":
            healthy += 1
        elif risk == "Moderate":
            attention += 1
        else:
            elevated_risk += 1
            
        machines_summary.append({
            "machine_id": m_id,
            "name": node.record.name,
            "status": node.record.current_status,
            "risk_category": risk,
            "health_index": node.latest_assessment.health_index if node.latest_assessment else 100.0,
            "temperature_c": node.latest_reading.temperature_c if node.latest_reading else 0.0,
            "vibration_rms_mms": node.latest_reading.vibration_rms_mms if node.latest_reading else 0.0,
            "current_a": node.latest_reading.current_a if node.latest_reading else 0.0,
            "load_pct": node.latest_reading.load_pct if node.latest_reading else 0.0,
            "local_model_version": node.record.current_local_model_version,
            "abnormal_condition": node.record.abnormal_condition
        })

    pending_updates = sum(1 for up in coordinator.update_repository.values() if up.status == "Awaiting Authorization")
    
    return {
        "total_machines": total,
        "healthy_machines": healthy,
        "machines_requiring_attention": attention,
        "machines_with_elevated_risk": elevated_risk,
        "pending_maintenance_count": sum(1 for n in FLEET.values() for r in n.local_store.get_local_maintenance_records() if r["status"] != "Completed"),
        "pending_federated_updates": pending_updates,
        "latest_shared_model_version": coordinator.current_global_version,
        "aggregation_rounds_count": len(coordinator.aggregation_rounds),
        "machines": machines_summary,
        "held_out_accuracy": coordinator.latest_evaluation["accuracy"],
        "held_out_f1": coordinator.latest_evaluation["f1_score"],
        "simulation_tag": "PHYSICS-GROUNDED SIMULATION ENVIRONMENT (PROTOTYPE)"
    }

@app.get("/api/machines")
def get_all_machines():
    return [node.record.model_dump() for node in FLEET.values()]

@app.post("/api/machines/register")
def register_machine(record: EquipmentRecord):
    if record.machine_id in FLEET:
        raise HTTPException(status_code=400, detail="Machine ID already exists")
    node = MachineNode(record, seed=int(time.time()) % 10000)
    FLEET[record.machine_id] = node
    
    privacy_guard.log_event(
        machine_id=record.machine_id,
        event_type="MACHINE_REGISTRATION",
        data_locality_verified=True,
        payload_type="EQUIPMENT_SPECIFICATION",
        bytes_transmitted=0,
        raw_sensor_samples_shared=0,
        details=f"Registered {record.name} ({record.machine_id}). Isolated local vault and digital twin created."
    )
    return {"status": "success", "machine": record.model_dump()}

@app.get("/api/machines/{machine_id}")
def get_machine_detail(machine_id: str):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    return node.record.model_dump()

# --- SENSORS & DIGITAL TWIN ---

@app.get("/api/machines/{machine_id}/sensors")
def get_machine_sensors(machine_id: str):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    node.step()
    history = node.simulator.history
    return {
        "machine_id": machine_id,
        "latest": node.latest_reading.model_dump() if node.latest_reading else None,
        "history": [r.model_dump() for r in history],
        "limits": node.record.operating_limits.model_dump(),
        "abnormal_condition": node.record.abnormal_condition
    }

@app.post("/api/machines/{machine_id}/inject-abnormal")
def inject_abnormal_condition(
    machine_id: str,
    condition: Optional[str] = Body(None, embed=True),
    severity: float = Body(0.6, embed=True)
):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    node.record.abnormal_condition = condition
    node.simulator.set_abnormal_condition(condition, severity)
    node.step()
    return {
        "status": "success",
        "machine_id": machine_id,
        "condition": condition,
        "severity": severity,
        "latest_vibration": node.latest_reading.vibration_rms_mms,
        "latest_temperature": node.latest_reading.temperature_c
    }

@app.post("/api/machines/{machine_id}/simulation/{action}")
def control_simulation(machine_id: str, action: str):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    if action == "start":
        node.simulator.is_running = True
        node.record.is_simulation_running = True
    elif action == "pause":
        node.simulator.is_running = False
        node.record.is_simulation_running = False
    elif action == "reset":
        node.simulator.is_running = True
        node.record.is_simulation_running = True
        node.simulator.set_abnormal_condition(None)
        node.record.abnormal_condition = None
        node.step()
    elif action == "step":
        node.step()
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    return {"status": "success", "is_running": node.simulator.is_running}

@app.get("/api/machines/{machine_id}/digital-twin")
def get_digital_twin_state(machine_id: str):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    if not node.latest_reading:
        node.step()
    state = node.digital_twin.evaluate_state(node.latest_reading)
    return state.model_dump()

@app.post("/api/machines/{machine_id}/digital-twin/calibrate")
def calibrate_digital_twin(
    machine_id: str,
    technician_notes: str = Body("Technician scheduled calibration", embed=True)
):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    res = node.digital_twin.calibrate(node.simulator.history, technician_notes)
    
    privacy_guard.log_event(
        machine_id=machine_id,
        event_type="TWIN_CALIBRATION",
        data_locality_verified=True,
        payload_type="LOCAL_PHYSICS_PARAMS",
        bytes_transmitted=0,
        raw_sensor_samples_shared=0,
        details=f"Digital Twin {node.record.twin_id} calibrated to v{node.digital_twin.calibration_version}. Local parameter update only."
    )
    return res

# --- PREDICTIVE MAINTENANCE & LOCAL MODEL ---

@app.get("/api/machines/{machine_id}/predictive-maintenance")
def get_predictive_maintenance(machine_id: str):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    node._refresh_prediction()
    return node.latest_assessment.model_dump()

# --- MAINTENANCE MANAGEMENT WORKFLOW ---

@app.get("/api/machines/{machine_id}/maintenance")
def get_machine_maintenance_records(machine_id: str):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    return node.local_store.get_local_maintenance_records()

@app.post("/api/machines/{machine_id}/maintenance")
def create_maintenance_activity(machine_id: str, record: MaintenanceActivity):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    record.machine_id = machine_id
    node.local_store.add_maintenance_record(record)
    
    # If completed and was corrective, reset fault condition to simulate repair
    if record.status == "Completed":
        node.record.last_maintenance_date = time.strftime("%Y-%m-%d")
        if node.record.abnormal_condition:
            node.simulator.set_abnormal_condition(None)
            node.record.abnormal_condition = None
            node.step()
            
    return {"status": "success", "record": record.model_dump()}

@app.put("/api/machines/{machine_id}/maintenance/{record_id}")
def update_maintenance_activity(
    machine_id: str,
    record_id: str,
    updates: Dict[str, Any] = Body(...)
):
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    updated = node.local_store.update_maintenance_record(record_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
        
    if updated.get("status") == "Completed" and node.record.abnormal_condition:
        node.simulator.set_abnormal_condition(None)
        node.record.abnormal_condition = None
        node.record.last_maintenance_date = time.strftime("%Y-%m-%d")
        node.step()
        
    return {"status": "success", "record": updated}

# --- FEDERATED LEARNING: LOCAL PREPARATION & AUTHORIZATION ---

@app.post("/api/machines/{machine_id}/prepare-update")
def prepare_local_model_update(machine_id: str):
    """
    Step 1 of Federated Maintenance Cycle:
    Trains local model on local operational history & newly verified maintenance findings.
    Extracts strictly parameter weights delta (NO raw data), checks privacy, and creates update payload.
    """
    if machine_id not in FLEET:
        raise HTTPException(status_code=404, detail="Machine not found")
    node = FLEET[machine_id]
    
    # Generate local training set from local history & confirmed conditions
    local_samples = []
    condition = node.record.abnormal_condition
    target_class = 0
    if condition == "bearing_fault":
        target_class = 1
    elif condition == "overheating":
        target_class = 2
    elif condition == "load_imbalance":
        target_class = 3
        
    for r in node.simulator.history[-40:]:
        twin_res = node.digital_twin.evaluate_state(r).residual_deviations
        local_samples.append((r.model_dump(), twin_res, target_class))
        
    # Execute local gradient descent (stays 100% on machine)
    train_metrics = node.local_model.train_local(local_samples, epochs=30, lr=0.03)
    
    # Export parameters only
    tensors = node.local_model.export_parameter_tensors()
    
    update_id = f"UPD-{machine_id}-{int(time.time()*1000)%100000:05d}"
    payload_dict = {
        "update_id": update_id,
        "machine_id": machine_id,
        "local_model_version": node.local_model.version,
        "base_global_version": coordinator.current_global_version,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "sample_count": train_metrics["samples"],
        "training_loss": train_metrics["loss"],
        "validation_accuracy": train_metrics["accuracy"],
        "parameter_summary": {
            "l2_norm": round(float(sum(sum(w**2 for w in row) for row in tensors["weights"])**0.5), 3),
            "bias_norm": round(float(sum(b**2 for b in tensors["biases"])**0.5), 3)
        },
        "parameter_weights": tensors["weights"],
        "parameter_biases": tensors["biases"],
        "status": "Awaiting Authorization"
    }

    # Deep privacy certification inspection
    cert = privacy_guard.inspect_and_certify_update_payload(payload_dict)
    if not cert["certified"]:
        raise HTTPException(status_code=400, detail=cert["message"])

    model_update = ModelUpdatePayload(
        **payload_dict,
        privacy_checksum=cert["checksum"],
        raw_sensor_data_leak_detected=False
    )
    
    coordinator.register_update(model_update)
    
    return {
        "status": "success",
        "update": model_update.model_dump(),
        "certification": cert
    }

@app.get("/api/coordinator/updates")
def get_coordinator_updates():
    return [up.model_dump() for up in coordinator.update_repository.values()]

@app.post("/api/coordinator/authorize-update/{update_id}")
def authorize_model_update(
    update_id: str,
    approved: bool = Body(..., embed=True),
    admin_user: str = Body("Admin: S. Chen", embed=True),
    reason: str = Body("", embed=True)
):
    updated = coordinator.authorize_update(update_id, admin_user, approved, reason)
    if not updated:
        raise HTTPException(status_code=404, detail="Update not found")
        
    privacy_guard.log_event(
        machine_id=updated.machine_id,
        event_type="AUTHORIZATION_DECISION",
        data_locality_verified=True,
        payload_type="AUTH_RECORD",
        bytes_transmitted=0,
        raw_sensor_samples_shared=0,
        details=f"Admin '{admin_user}' {'APPROVED' if approved else 'REJECTED'} update {update_id}. Reason: {reason or 'Complies with data governance'}"
    )
    return {"status": "success", "update": updated.model_dump()}

@app.post("/api/coordinator/aggregate")
def run_federated_aggregation():
    res = coordinator.aggregate_approved_updates()
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
        
    privacy_guard.log_event(
        machine_id="COORDINATOR",
        event_type="FEDERATED_AGGREGATION",
        data_locality_verified=True,
        payload_type="GLOBAL_AGGREGATED_TENSOR",
        bytes_transmitted=len(res["round"]["participating_machines"]) * 256,
        raw_sensor_samples_shared=0,
        details=f"FedAvg round #{res['round']['round_number']} completed with {len(res['round']['participating_machines'])} machines. Model advanced to {res['new_version']}."
    )
    return res

@app.post("/api/coordinator/distribute")
def distribute_shared_model():
    """
    Distributes updated global model parameters back to all participating machines.
    Machines retain their individual local twins and calibration!
    """
    distributed_to = []
    for m_id, node in FLEET.items():
        node.local_model.load_parameter_tensors(
            coordinator.global_weights,
            coordinator.global_biases,
            coordinator.current_global_version
        )
        node.record.current_local_model_version = coordinator.current_global_version
        distributed_to.append(m_id)
        
    if coordinator.aggregation_rounds:
        coordinator.mark_distributed(coordinator.aggregation_rounds[-1].round_number)
        
    privacy_guard.log_event(
        machine_id="COORDINATOR",
        event_type="MODEL_DISTRIBUTION",
        data_locality_verified=True,
        payload_type="ENCRYPTED_GLOBAL_WEIGHTS",
        bytes_transmitted=len(distributed_to) * 312,
        raw_sensor_samples_shared=0,
        details=f"Shared model {coordinator.current_global_version} synchronized to {len(distributed_to)} machines. Local twins & data remain untouched."
    )
    
    return {
        "status": "success",
        "new_version": coordinator.current_global_version,
        "synchronized_machines": distributed_to
    }

# --- MODEL EVALUATION & GOVERNANCE AUDIT ---

@app.get("/api/model/evaluation")
def get_model_evaluation():
    # Per-machine local evaluation comparison
    per_machine = {}
    for m_id, node in FLEET.items():
        eval_res = coordinator.evaluate_model(node.local_model.weights, node.local_model.biases)
        per_machine[m_id] = {
            "name": node.record.name,
            "version": node.local_model.version,
            "accuracy": eval_res["accuracy"],
            "f1_score": eval_res["f1_score"],
            "loss": eval_res["loss"],
            "training_cycles": node.local_model.training_cycles
        }
        
    return {
        "global_model_version": coordinator.current_global_version,
        "global_evaluation": coordinator.latest_evaluation,
        "per_machine_evaluation": per_machine,
        "aggregation_history": [r.model_dump() for r in coordinator.aggregation_rounds]
    }

@app.get("/api/privacy/audit-trail")
def get_privacy_audit_trail():
    return {
        "policy": {
            "data_locality_rule": "MANDATORY: Raw operational sensor histories and detailed maintenance records remain strictly local.",
            "transmission_permission": "Only approved parameter weights (8x4 tensors) and scalar training metrics permitted.",
            "peer_to_peer_prohibited": True,
            "cryptographic_verification": "SHA-256 payload integrity check before coordinator ingest."
        },
        "audit_logs": privacy_guard.get_audit_trail(60),
        "total_raw_samples_uploaded": 0
    }

# --- 3-MACHINE DEMONSTRATION SCENARIO STEPPER ---

@app.get("/api/scenario/state")
def get_scenario_state():
    return SCENARIO_STATE

@app.post("/api/scenario/step/{step_number}")
def execute_scenario_step(step_number: int):
    SCENARIO_STATE["current_step"] = step_number
    
    if step_number == 1:
        # Reset to initial clean state
        initialize_default_motors()
    elif step_number == 2:
        # Stream baseline nominal
        for node in FLEET.values():
            node.simulator.set_abnormal_condition(None)
            node.step()
    elif step_number == 3:
        # Introduce bearing fault in Motor B
        FLEET["MTR-002"].simulator.set_abnormal_condition("bearing_fault", severity=0.8)
        FLEET["MTR-002"].record.abnormal_condition = "bearing_fault"
        for _ in range(8):
            FLEET["MTR-002"].step()
    elif step_number == 4 or step_number == 5:
        # Step Motor B forward to generate high residual & elevated risk
        for _ in range(5):
            FLEET["MTR-002"].step()
    elif step_number == 6:
        # Create completed maintenance activity for Motor B
        FLEET["MTR-002"].local_store.add_maintenance_record(MaintenanceActivity(
            id=f"MAINT-CORR-{int(time.time())%10000}",
            machine_id="MTR-002",
            activity_type="Corrective",
            status="Completed",
            created_at=time.strftime("%Y-%m-%d %H:%M:%S"),
            completed_at=time.strftime("%Y-%m-%d %H:%M:%S"),
            technician_name="R. Vance (Vibration Analyst L2)",
            observations="Acoustic emission detected BPFO harmonic spikes. Drive-end housing temp 74°C.",
            confirmed_findings="Confirmed spalling and micro-pitting on outer bearing raceway (NU 314). Lubricant contaminated.",
            actions_taken="Replaced bearing with new SKF NU 314 ECP. Flushed housing and refilled with synthetic ISO VG 220.",
            operating_hours_at_service=12400.0,
            parts_replaced=["Cylindrical Roller Bearing NU 314", "Shaft seal"],
            local_update_eligible=True
        ))
        FLEET["MTR-002"].record.last_maintenance_date = time.strftime("%Y-%m-%d")
        FLEET["MTR-002"].simulator.set_abnormal_condition(None)
        FLEET["MTR-002"].record.abnormal_condition = None
        FLEET["MTR-002"].step()
    elif step_number == 7:
        # Prepare local update for Motor B
        prepare_local_model_update("MTR-002")
    elif step_number == 8:
        # Approve all pending updates
        for up in coordinator.update_repository.values():
            if up.status == "Awaiting Authorization":
                coordinator.authorize_update(up.update_id, "Chief Plant Engineer", True, "Compliant maintenance verification")
    elif step_number == 9:
        # Run FedAvg aggregation
        coordinator.aggregate_approved_updates()
    elif step_number == 10:
        # Distribute model to fleet
        distribute_shared_model()

    return {
        "status": "success",
        "current_step": step_number,
        "description": SCENARIO_STATE["step_descriptions"][min(step_number, len(SCENARIO_STATE["step_descriptions"])-1)]
    }

@app.post("/api/scenario/reset")
def reset_scenario():
    initialize_default_motors()
    SCENARIO_STATE["current_step"] = 1
    return {"status": "reset_complete"}

# Mount Frontend Static Build
frontend_dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist_dir):
    app.mount("/", StaticFiles(directory=frontend_dist_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
