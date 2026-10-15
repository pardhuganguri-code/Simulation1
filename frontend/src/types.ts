export type UserRole = "Plant Manager" | "Maintenance Technician" | "System Administrator";

export interface TechnicalSpecs {
  rated_power_kw: number;
  rated_voltage_v: number;
  rated_current_a: number;
  rated_speed_rpm: number;
  poles: number;
  bearing_type: string;
  insulation_class: string;
  cooling_type?: string;
  efficiency_class?: string;
}

export interface OperatingLimits {
  max_temperature_c: number;
  warning_temperature_c: number;
  max_vibration_rms_mms: number;
  warning_vibration_rms_mms: number;
  max_current_a: number;
  rated_speed_rpm?: number;
}

export interface EquipmentRecord {
  machine_id: string;
  name: string;
  category: string;
  manufacturer: string;
  model_number: string;
  technical_specs: TechnicalSpecs;
  operating_limits: OperatingLimits;
  installation_date: string;
  datasheet_reference: string;
  historical_data_reference: string;
  sensor_configuration: string[];
  current_status: string;
  last_maintenance_date: string;
  twin_id: string;
  local_model_id: string;
  current_local_model_version: string;
  is_simulation_running: boolean;
  abnormal_condition?: string | null;
}

export interface SensorReading {
  timestamp: string;
  temperature_c: number;
  vibration_rms_mms: number;
  current_a: number;
  speed_rpm: number;
  load_pct: number;
  vibration_peak_to_peak: number;
  frequency_hz: number;
  is_abnormal: boolean;
  data_quality: string;
}

export interface ExpectedRangeItem {
  expected: number;
  lower_bound: number;
  upper_bound: number;
  warning_limit: number;
  critical_limit: number;
}

export interface DigitalTwinState {
  twin_id: string;
  machine_id: string;
  calibration_version: number;
  last_calibration_timestamp: string;
  thermal_time_constant_tau: number;
  baseline_vibration_rms: number;
  bearing_wear_factor: number;
  expected_ranges: {
    temperature_c: ExpectedRangeItem;
    vibration_rms_mms: ExpectedRangeItem;
    current_a: ExpectedRangeItem;
    speed_rpm: ExpectedRangeItem;
  };
  observed_values: {
    temperature_c: number;
    vibration_rms_mms: number;
    current_a: number;
    speed_rpm: number;
    load_pct: number;
  };
  residual_deviations: {
    temp_residual_c: number;
    vib_residual_mms: number;
    current_residual_a: number;
    speed_residual_rpm: number;
  };
  calibration_history: Array<{
    version: number;
    timestamp: string;
    triggered_by: string;
    notes: string;
    residual_reduction_pct: number;
  }>;
  model_assumptions: string[];
  documented_specs: Record<string, any>;
}

export interface FailureModeItem {
  mode: string;
  probability: number;
  severity_score: number;
}

export interface PredictiveAssessment {
  machine_id: string;
  timestamp: string;
  health_index: number;
  risk_category: "Low" | "Moderate" | "High" | "Critical";
  numerical_risk_score: number;
  confidence_interval: [number, number];
  observed_indicators: string[];
  potential_failure_modes: FailureModeItem[];
  recommended_priority: string;
  model_version: string;
  explanation: string;
}

export interface MaintenanceActivity {
  id: string;
  machine_id: string;
  activity_type: "Routine" | "Corrective" | "Predictive Inspection";
  status: "Scheduled" | "In Progress" | "Completed";
  created_at: string;
  completed_at?: string | null;
  technician_name: string;
  observations: string;
  confirmed_findings?: string | null;
  actions_taken?: string | null;
  operating_hours_at_service: number;
  parts_replaced: string[];
  local_update_eligible: boolean;
}

export interface ModelUpdatePayload {
  update_id: string;
  machine_id: string;
  local_model_version: string;
  base_global_version: string;
  timestamp: string;
  sample_count: number;
  training_loss: number;
  validation_accuracy: number;
  parameter_summary: {
    l2_norm: number;
    bias_norm: number;
  };
  parameter_weights: number[][];
  parameter_biases: number[];
  status: "Prepared Locally" | "Awaiting Authorization" | "Approved" | "Rejected" | "Aggregated";
  authorization_decision_by?: string | null;
  authorization_timestamp?: string | null;
  rejection_reason?: string | null;
  privacy_checksum: string;
  raw_sensor_data_leak_detected: boolean;
}

export interface FederatedRound {
  round_number: number;
  timestamp: string;
  base_model_version: string;
  new_model_version: string;
  participating_machines: string[];
  total_samples: number;
  pre_aggregation_accuracy: number;
  post_aggregation_accuracy: number;
  pre_aggregation_loss: number;
  post_aggregation_loss: number;
  improvement_delta_pct: number;
  distribution_status: string;
}

export interface FleetMachineSummary {
  machine_id: string;
  name: string;
  status: string;
  risk_category: "Low" | "Moderate" | "High" | "Critical";
  health_index: number;
  temperature_c: number;
  vibration_rms_mms: number;
  current_a: number;
  load_pct: number;
  local_model_version: string;
  abnormal_condition?: string | null;
}

export interface FleetStatusResponse {
  total_machines: number;
  healthy_machines: number;
  machines_requiring_attention: number;
  machines_with_elevated_risk: number;
  pending_maintenance_count: number;
  pending_federated_updates: number;
  latest_shared_model_version: string;
  aggregation_rounds_count: number;
  machines: FleetMachineSummary[];
  held_out_accuracy: number;
  held_out_f1: number;
  simulation_tag: string;
}

export interface PrivacyAuditEntry {
  id: string;
  timestamp: string;
  machine_id: string;
  event_type: string;
  data_locality_verified: boolean;
  payload_type: string;
  bytes_transmitted: number;
  raw_sensor_samples_shared: number;
  details: string;
}

export interface ModelEvaluationResponse {
  global_model_version: string;
  global_evaluation: {
    accuracy: number;
    loss: number;
    precision: number;
    recall: number;
    f1_score: number;
    false_positive_rate: number;
    true_positives: number;
    false_positives: number;
    true_negatives: number;
    false_negatives: number;
    confusion_matrix: number[][];
    classes: string[];
    test_samples_count: number;
    timestamp: string;
  };
  per_machine_evaluation: Record<string, {
    name: string;
    version: string;
    accuracy: number;
    f1_score: number;
    loss: number;
    training_cycles: number;
  }>;
  aggregation_history: FederatedRound[];
}
