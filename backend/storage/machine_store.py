"""
Isolated Local Storage per Machine.
Enforces the mandatory architectural rule:
'Raw operational sensor histories and detailed maintenance records must remain local by default.
Machines must operate independently, without direct machine-to-machine communication.'
"""
import os
import json
import time
from typing import List, Dict, Any, Optional
from backend.models import SensorReading, MaintenanceActivity

BASE_STORAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "local_machine_vaults")

class LocalMachineStore:
    def __init__(self, machine_id: str):
        self.machine_id = machine_id
        self.vault_path = os.path.join(BASE_STORAGE_PATH, machine_id)
        os.makedirs(self.vault_path, exist_ok=True)
        
        self.sensor_file = os.path.join(self.vault_path, "local_sensor_history.json")
        self.maintenance_file = os.path.join(self.vault_path, "local_maintenance_records.json")
        self.model_state_file = os.path.join(self.vault_path, "local_model_parameters.json")
        
        self._init_files_if_needed()

    def _init_files_if_needed(self):
        if not os.path.exists(self.sensor_file):
            with open(self.sensor_file, "w") as f:
                json.dump([], f)
        if not os.path.exists(self.maintenance_file):
            with open(self.maintenance_file, "w") as f:
                json.dump([], f)
        if not os.path.exists(self.model_state_file):
            with open(self.model_state_file, "w") as f:
                json.dump({
                    "model_version": "v1.0.0",
                    "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "local_training_cycles": 0
                }, f)

    def append_sensor_reading(self, reading: SensorReading):
        """Append raw sensor reading strictly into the local vault."""
        try:
            with open(self.sensor_file, "r") as f:
                history = json.load(f)
        except Exception:
            history = []
            
        history.append(reading.model_dump())
        # Keep sliding window of latest 500 samples in local vault
        if len(history) > 500:
            history = history[-500:]
            
        with open(self.sensor_file, "w") as f:
            json.dump(history, f, indent=2)

    def get_local_sensor_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Accessed only by the local machine's UI or local training."""
        try:
            with open(self.sensor_file, "r") as f:
                history = json.load(f)
                return history[-limit:]
        except Exception:
            return []

    def get_local_maintenance_records(self) -> List[Dict[str, Any]]:
        try:
            with open(self.maintenance_file, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def add_maintenance_record(self, record: MaintenanceActivity):
        records = self.get_local_maintenance_records()
        records.append(record.model_dump())
        with open(self.maintenance_file, "w") as f:
            json.dump(records, f, indent=2)

    def update_maintenance_record(self, record_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        records = self.get_local_maintenance_records()
        updated_record = None
        for r in records:
            if r["id"] == record_id:
                r.update(updates)
                updated_record = r
                break
        if updated_record:
            with open(self.maintenance_file, "w") as f:
                json.dump(records, f, indent=2)
        return updated_record

    def save_local_model_state(self, state: Dict[str, Any]):
        with open(self.model_state_file, "w") as f:
            json.dump(state, f, indent=2)

    def get_local_model_state(self) -> Dict[str, Any]:
        try:
            with open(self.model_state_file, "r") as f:
                return json.load(f)
        except Exception:
            return {"model_version": "v1.0.0", "local_training_cycles": 0}
