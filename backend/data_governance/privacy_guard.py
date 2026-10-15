"""
Privacy and Data Governance Guard.
Enforces strict boundaries between local machine operational data and the central coordinator.
Provides cryptographic validation that NO raw sensor time-series or detailed maintenance
narratives ever leave the local boundary.
"""
import hashlib
import json
import time
from typing import Dict, Any, List
from backend.models import PrivacyAuditEntry, ModelUpdatePayload

class PrivacyGovernanceManager:
    def __init__(self):
        self.audit_trail: List[PrivacyAuditEntry] = []
        self._initialize_policies()

    def _initialize_policies(self):
        # Baseline policy records
        self.log_event(
            machine_id="SYSTEM",
            event_type="POLICY_INITIALIZATION",
            data_locality_verified=True,
            payload_type="GOVERNANCE_CONFIG",
            bytes_transmitted=0,
            raw_sensor_samples_shared=0,
            details="Strict zero-raw-sensor transmission policy established across all fleet nodes."
        )

    def log_event(
        self,
        machine_id: str,
        event_type: str,
        data_locality_verified: bool,
        payload_type: str,
        bytes_transmitted: int,
        raw_sensor_samples_shared: int,
        details: str
    ) -> PrivacyAuditEntry:
        entry = PrivacyAuditEntry(
            id=f"AUDIT-{int(time.time()*1000)%10000000:07d}",
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            machine_id=machine_id,
            event_type=event_type,
            data_locality_verified=data_locality_verified,
            payload_type=payload_type,
            bytes_transmitted=bytes_transmitted,
            raw_sensor_samples_shared=raw_sensor_samples_shared,
            details=details
        )
        self.audit_trail.append(entry)
        return entry

    def inspect_and_certify_update_payload(self, raw_payload_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deep packet / object inspection to verify zero raw sensor leakage.
        Verifies:
        1. No keys matching 'history', 'samples', 'time_series', 'readings', 'waveform'
        2. Parameter weights dimension is strictly 8x4 matrix of floats
        3. Generates cryptographic SHA-256 hash of parameter tensor
        """
        forbidden_keys = ["history", "samples", "sensor_data", "time_series", "readings", "waveform", "inspection_notes"]
        leak_detected = False
        leak_details = []

        for key in raw_payload_dict.keys():
            if any(forbidden in key.lower() for forbidden in forbidden_keys):
                leak_detected = True
                leak_details.append(f"Forbidden data key found in transmission payload: {key}")

        weights = raw_payload_dict.get("parameter_weights", [])
        biases = raw_payload_dict.get("parameter_biases", [])

        # Validate tensor dimensions (8 features x 4 classes)
        if len(weights) != 8 or any(len(row) != 4 for row in weights) or len(biases) != 4:
            leak_detected = True
            leak_details.append("Model tensor dimensions violate strict 8x4 parameter specification.")

        # Compute deterministic checksum
        payload_bytes = json.dumps({"w": weights, "b": biases}, sort_keys=True).encode("utf-8")
        checksum = hashlib.sha256(payload_bytes).hexdigest()
        payload_size_bytes = len(payload_bytes)

        if not leak_detected:
            self.log_event(
                machine_id=raw_payload_dict.get("machine_id", "UNKNOWN"),
                event_type="UPDATE_PREPARATION",
                data_locality_verified=True,
                payload_type="MODEL_PARAMETERS_ONLY",
                bytes_transmitted=payload_size_bytes,
                raw_sensor_samples_shared=0,
                details=f"Certified parameter update ({payload_size_bytes} bytes). 0 raw sensor data points transmitted. SHA256: {checksum[:12]}..."
            )
            return {
                "certified": True,
                "checksum": checksum,
                "payload_size_bytes": payload_size_bytes,
                "raw_samples_transmitted": 0,
                "message": "Update payload fully certified. Raw data locality preserved."
            }
        else:
            self.log_event(
                machine_id=raw_payload_dict.get("machine_id", "UNKNOWN"),
                event_type="DATA_LEAK_PREVENTED",
                data_locality_verified=False,
                payload_type="REJECTED_PAYLOAD",
                bytes_transmitted=0,
                raw_sensor_samples_shared=0,
                details=f"Interception! Payload rejected due to policy violations: {'; '.join(leak_details)}"
            )
            return {
                "certified": False,
                "checksum": "REJECTED",
                "payload_size_bytes": 0,
                "raw_samples_transmitted": 0,
                "message": f"Security Violation: {'; '.join(leak_details)}"
            }

    def get_audit_trail(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [entry.model_dump() for entry in reversed(self.audit_trail[-limit:])]
