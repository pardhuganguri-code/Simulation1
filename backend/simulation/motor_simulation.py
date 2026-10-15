"""
Physics-informed industrial motor simulation engine.
Simulates 3-phase squirrel cage induction motors with thermal, electromechanical,
and vibration dynamics.
"""
import math
import random
import time
from typing import Dict, List, Optional
from backend.models import SensorReading

class MotorSimulator:
    def __init__(
        self,
        machine_id: str,
        rated_power_kw: float = 75.0,
        rated_voltage_v: float = 400.0,
        rated_current_a: float = 135.0,
        rated_speed_rpm: float = 1485.0,
        poles: int = 4,
        ambient_temp_c: float = 26.0,
        seed: int = 42
    ):
        self.machine_id = machine_id
        self.rated_power_kw = rated_power_kw
        self.rated_voltage_v = rated_voltage_v
        self.rated_current_a = rated_current_a
        self.rated_speed_rpm = rated_speed_rpm
        self.poles = poles
        self.ambient_temp_c = ambient_temp_c
        
        # Internal state
        self.rng = random.Random(seed)
        self.step_count = 0
        self.is_running = True
        self.load_factor = 0.75  # 75% load by default
        self.current_temp_c = ambient_temp_c + 32.0  # warmed up operating temp ~58C
        self.abnormal_condition: Optional[str] = None
        self.abnormal_severity: float = 0.0  # 0.0 to 1.0
        
        # Fault injection characteristics
        self.bearing_wear_progression = 0.0
        self.thermal_overload_progression = 0.0
        
        # History buffer (local only)
        self.history: List[SensorReading] = []
        self.max_history = 120

    def set_abnormal_condition(self, condition: Optional[str], severity: float = 0.5):
        self.abnormal_condition = condition
        self.abnormal_severity = max(0.0, min(1.0, severity))
        if condition is None:
            self.bearing_wear_progression = 0.0
            self.thermal_overload_progression = 0.0

    def step(self, delta_t_sec: float = 1.0) -> SensorReading:
        if not self.is_running:
            # Return last reading or idle state
            return self._idle_reading()

        self.step_count += 1
        
        # Load dynamics with small stochastic drift
        load_jitter = self.rng.gauss(0, 0.015)
        effective_load = max(0.1, min(1.25, self.load_factor + load_jitter))
        
        # Synchronous speed = 120 * f / P = 1500 RPM at 50Hz
        sync_speed = 1500.0
        nominal_slip = (sync_speed - self.rated_speed_rpm) / sync_speed  # ~0.01
        actual_slip = nominal_slip * effective_load
        base_speed = sync_speed * (1.0 - actual_slip)
        speed_rpm = base_speed + self.rng.gauss(0, 1.8)
        
        # Current calculation: no-load magnetizing current + active load current
        no_load_current = self.rated_current_a * 0.28
        current_a = no_load_current + (self.rated_current_a - no_load_current) * (effective_load ** 0.95)
        current_a += self.rng.gauss(0, 0.6)
        
        # Vibration calculation (ISO 10816-3 RMS velocity in mm/s)
        # Normal baseline: 0.8 to 1.2 mm/s
        baseline_vib = 0.85 + (effective_load * 0.35)
        vibration_rms = baseline_vib + self.rng.gauss(0, 0.04)
        
        # Fault injection impacts
        if self.abnormal_condition == "bearing_fault":
            # Progressive outer/inner race flaking: vibration rises significantly
            self.bearing_wear_progression = min(1.0, self.bearing_wear_progression + 0.04)
            fault_vib_bump = (self.bearing_wear_progression * self.abnormal_severity) * 4.6
            vibration_rms += fault_vib_bump + self.rng.gauss(0, 0.15)
            # Local frictional heating
            thermal_bump = (self.bearing_wear_progression * self.abnormal_severity) * 16.5
        elif self.abnormal_condition == "overheating":
            self.thermal_overload_progression = min(1.0, self.thermal_overload_progression + 0.05)
            fault_vib_bump = 0.4 * self.thermal_overload_progression
            vibration_rms += fault_vib_bump
            thermal_bump = (self.thermal_overload_progression * self.abnormal_severity) * 38.0
        elif self.abnormal_condition == "load_imbalance":
            vibration_rms += 2.2 * self.abnormal_severity + self.rng.gauss(0, 0.2)
            current_a += 12.0 * self.abnormal_severity
            thermal_bump = 8.0 * self.abnormal_severity
        else:
            thermal_bump = 0.0

        # Thermal evolution: dT/dt = (P_loss/C_th) - (T - T_amb)/tau
        # Steady state target temp:
        p_loss_factor = (current_a / self.rated_current_a) ** 2
        steady_state_temp = self.ambient_temp_c + (42.0 * p_loss_factor) + thermal_bump
        
        # Thermal inertia (tau ~ 300 sec)
        tau = 80.0  # accelerated for interactive simulation demonstration
        self.current_temp_c += (steady_state_temp - self.current_temp_c) * (delta_t_sec / tau)
        self.current_temp_c += self.rng.gauss(0, 0.1)

        # Vibration peak-to-peak (typically ~2.8 to 3.8x RMS in healthy, higher in impact faults)
        crest_factor = 3.2 if self.abnormal_condition != "bearing_fault" else (3.8 + 1.2 * self.bearing_wear_progression)
        vib_p2p = vibration_rms * crest_factor

        is_abnormal = (vibration_rms > 2.8) or (self.current_temp_c > 80.0) or (self.abnormal_condition is not None)
        
        reading = SensorReading(
            timestamp=time.strftime("%H:%M:%S", time.localtime()),
            temperature_c=round(self.current_temp_c, 2),
            vibration_rms_mms=round(max(0.1, vibration_rms), 2),
            current_a=round(max(0.0, current_a), 2),
            speed_rpm=round(speed_rpm, 1),
            load_pct=round(effective_load * 100, 1),
            vibration_peak_to_peak=round(vib_p2p, 2),
            frequency_hz=50.0,
            is_abnormal=is_abnormal,
            data_quality="Good"
        )
        
        self.history.append(reading)
        if len(self.history) > self.max_history:
            self.history.pop(0)
            
        return reading

    def _idle_reading(self) -> SensorReading:
        # Cool down towards ambient
        self.current_temp_c += (self.ambient_temp_c - self.current_temp_c) * 0.05
        return SensorReading(
            timestamp=time.strftime("%H:%M:%S", time.localtime()),
            temperature_c=round(self.current_temp_c, 2),
            vibration_rms_mms=0.04,
            current_a=0.0,
            speed_rpm=0.0,
            load_pct=0.0,
            vibration_peak_to_peak=0.1,
            frequency_hz=50.0,
            is_abnormal=False,
            data_quality="Good"
        )
