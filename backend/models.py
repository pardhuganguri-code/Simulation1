"""
Data models and schemas for Federated-Privacy Machine Pulse
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

class TechnicalSpecs(BaseModel):
    rated_power_kw: float = 75.0
    rated_voltage_v: float = 400.0
    rated_current_a: float = 135.0
    rated_speed_rpm: float = 1485.0
    poles: int = 4
    bearing_type: str = "Deep Groove Ball Bearing 6316"
    insulation_class: str = "Class F (155°C max)"
    cooling_type: str = "IC411 (Totally Enclosed Fan-Cooled)"
    efficiency_class: str = "IE3 Premium Efficiency"

class OperatingLimits(BaseModel):
    max_temperature_c: float = 95.0
    warning_temperature_c: float = 80.0
    max_vibration_rms_mms: float = 4.5  # ISO 10816-3 Class II zone C/D boundary
    warning_vibration_rms_mms: float = 2.8
    max_current_a: float = 150.0
    rated_speed_rpm: float = 1485.0

class EquipmentRecord(BaseModel):
    machine_id: str
    name: str
    category: str = "Industrial Electric Motor"
    manufacturer: str
    model_number: str
    technical_specs: TechnicalSpecs
    operating_limits: OperatingLimits
    installation_date: str
    datasheet_reference: str
    historical_data_reference: str
    sensor_configuration: List[str]
    current_status: str = "Operational"  # Operational, Warning, Critical, Under Maintenance, Offline
    last_maintenance_date: str
    twin_id: str
    local_model_id: str
    current_local_model_version: str = "v1.0.0"
    is_simulation_running: bool = True
    abnormal_condition: Optional[str] = None  # None, "bearing_fault", "overheating", "load_imbalance"

class SensorReading(BaseModel):
    timestamp: str
    temperature_c: float
    vibration_rms_mms: float
    current_a: float
    speed_rpm: float
    load_pct: float
    vibration_peak_to_peak: float
    frequency_hz: float = 50.0
    is_abnormal: bool = False
    data_quality: str = "Good"  # Good, Degraded, Sensor Fault

class DigitalTwinState(BaseModel):
    twin_id: str
    machine_id: str
    calibration_version: int = 1
    last_calibration_timestamp: str
    thermal_time_constant_tau: float = 420.0
    baseline_vibration_rms: float = 0.82
    bearing_wear_factor: float = 1.0
    expected_ranges: Dict[str, Dict[str, float]]
    observed_values: Dict[str, float]
    residual_deviations: Dict[str, float]
    calibration_history: List[Dict[str, Any]]
    model_assumptions: List[str]
    documented_specs: Dict[str, Any]

class PredictiveAssessment(BaseModel):
    machine_id: str
    timestamp: str
    health_index: float  # 0 to 100
    risk_category: str  # "Low", "Moderate", "High", "Critical"
    numerical_risk_score: float  # 0.0 to 1.0
    confidence_interval: List[float]  # [lower, upper]
    observed_indicators: List[str]
    potential_failure_modes: List[Dict[str, Any]]
    recommended_priority: str  # "Routine", "Medium", "Urgent", "Immediate Shutdown"
    model_version: str
    explanation: str

class MaintenanceActivity(BaseModel):
    id: str
    machine_id: str
    activity_type: str  # "Routine", "Corrective", "Predictive Inspection"
    status: str  # "Scheduled", "In Progress", "Completed"
    created_at: str
    completed_at: Optional[str] = None
    technician_name: str
    observations: str
    confirmed_findings: Optional[str] = None
    actions_taken: Optional[str] = None
    operating_hours_at_service: float
    parts_replaced: List[str] = []
    local_update_eligible: bool = False

class ModelUpdatePayload(BaseModel):
    update_id: str
    machine_id: str
    local_model_version: str
    base_global_version: str
    timestamp: str
    sample_count: int
    training_loss: float
    validation_accuracy: float
    # Weights delta tensor summary (never raw data)
    parameter_summary: Dict[str, float]
    parameter_weights: List[List[float]]
    parameter_biases: List[float]
    status: str  # "Prepared Locally", "Awaiting Authorization", "Approved", "Rejected", "Aggregated"
    authorization_decision_by: Optional[str] = None
    authorization_timestamp: Optional[str] = None
    rejection_reason: Optional[str] = None
    privacy_checksum: str
    raw_sensor_data_leak_detected: bool = False

class FederatedRound(BaseModel):
    round_number: int
    timestamp: str
    base_model_version: str
    new_model_version: str
    participating_machines: List[str]
    total_samples: int
    pre_aggregation_accuracy: float
    post_aggregation_accuracy: float
    pre_aggregation_loss: float
    post_aggregation_loss: float
    improvement_delta_pct: float
    distribution_status: str  # "Distributed", "Pending"

class PrivacyAuditEntry(BaseModel):
    id: str
    timestamp: str
    machine_id: str
    event_type: str  # "LOCAL_TRAINING", "UPDATE_PREPARATION", "AUTHORIZATION_GRANTED", "FEDERATED_AGGREGATION", "MODEL_DISTRIBUTION"
    data_locality_verified: bool
    payload_type: str
    bytes_transmitted: int
    raw_sensor_samples_shared: int = 0
    details: str
