import React, { useState, useEffect } from "react";
import { DigitalTwinState, UserRole } from "../types";
import {
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Info,
  Calendar,
  Layers,
} from "lucide-react";
import { fetchDigitalTwinState, calibrateDigitalTwin, controlSimulation } from "../api";

interface DigitalTwinViewProps {
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  machineIds: string[];
  userRole: UserRole;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  selectedMachineId,
  onSelectMachine,
  machineIds,
  userRole,
}) => {
  const [twinState, setTwinState] = useState<DigitalTwinState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibNotes, setCalibNotes] = useState<string>("Quarterly routine dynamic calibration");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadTwin = async () => {
    try {
      const data = await fetchDigitalTwinState(selectedMachineId);
      setTwinState(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadTwin();
    const interval = setInterval(loadTwin, 3000);
    return () => clearInterval(interval);
  }, [selectedMachineId]);

  const handleCalibrate = async () => {
    setIsCalibrating(true);
    try {
      await calibrateDigitalTwin(selectedMachineId, calibNotes);
      setFeedbackMsg(`Digital Twin successfully calibrated to next version! Residuals adjusted.`);
      await loadTwin();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg(`Calibration error: ${err.message}`);
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleSimAction = async (action: "start" | "pause" | "reset") => {
    try {
      await controlSimulation(selectedMachineId, action);
      await loadTwin();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && !twinState) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Activity className="w-6 h-6 animate-spin mr-2 text-teal-500" />
        Loading Equipment-Specific Digital Twin...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Header & Machine Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Equipment-Specific Digital Twin</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Physics-grounded nominal behavioral model, expected vs. observed residuals, and iterative Bayesian calibration.
          </p>
        </div>

        {/* Machine Picker Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Motor Node:</span>
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
            {machineIds.map((id) => (
              <button
                key={id}
                onClick={() => onSelectMachine(id)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition ${
                  selectedMachineId === id
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-300"
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-teal-50 border border-teal-300 text-teal-800 text-xs rounded-lg flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold text-teal-600">×</button>
        </div>
      )}

      {twinState && (
        <>
          {/* Twin Status & Simulation Controls Bar */}
          <div className="industrial-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-teal-300">{twinState.twin_id}</span>
                  <span className="bg-teal-900/60 text-teal-300 border border-teal-700 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    CALIBRATION v{twinState.calibration_version}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Associated Equipment: <span className="text-white font-medium">{twinState.machine_id}</span> • Last Calibrated: {twinState.last_calibration_timestamp}
                </div>
              </div>
            </div>

            {/* Simulation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSimAction("start")}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded flex items-center gap-1 transition"
                title="Resume Telemetry Simulation"
              >
                <Play className="w-3.5 h-3.5" /> Start
              </button>
              <button
                onClick={() => handleSimAction("pause")}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded flex items-center gap-1 transition"
                title="Pause Telemetry Simulation"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
              <button
                onClick={() => handleSimAction("reset")}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded flex items-center gap-1 transition"
                title="Reset to Factory Baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Residual Deviation Cards (Expected vs Observed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vibration RMS Residual */}
            <div className="industrial-card p-4">
              <div className="flex justify-between items-start text-xs mb-2">
                <span className="font-bold text-slate-700">Vibration RMS Residual</span>
                <span className="text-[10px] text-slate-400">ISO 10816</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className={`text-2xl font-bold font-mono ${
                    Math.abs(twinState.residual_deviations.vib_residual_mms) > 1.2
                      ? "text-rose-600"
                      : "text-slate-800"
                  }`}
                >
                  {twinState.residual_deviations.vib_residual_mms > 0 ? "+" : ""}
                  {twinState.residual_deviations.vib_residual_mms.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">mm/s dev</span>
              </div>
              <div className="text-xs space-y-1 pt-2 border-t border-slate-100 text-slate-500">
                <div className="flex justify-between">
                  <span>Observed:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {twinState.observed_values.vibration_rms_mms.toFixed(2)} mm/s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Twin Expected:</span>
                  <span className="font-mono text-slate-700">
                    {twinState.expected_ranges.vibration_rms_mms.expected.toFixed(2)} mm/s
                  </span>
                </div>
              </div>
            </div>

            {/* Temperature Residual */}
            <div className="industrial-card p-4">
              <div className="flex justify-between items-start text-xs mb-2">
                <span className="font-bold text-slate-700">Temperature Residual</span>
                <span className="text-[10px] text-slate-400">IEC 60034</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className={`text-2xl font-bold font-mono ${
                    Math.abs(twinState.residual_deviations.temp_residual_c) > 6.0
                      ? "text-rose-600"
                      : "text-slate-800"
                  }`}
                >
                  {twinState.residual_deviations.temp_residual_c > 0 ? "+" : ""}
                  {twinState.residual_deviations.temp_residual_c.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">°C dev</span>
              </div>
              <div className="text-xs space-y-1 pt-2 border-t border-slate-100 text-slate-500">
                <div className="flex justify-between">
                  <span>Observed:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {twinState.observed_values.temperature_c.toFixed(1)} °C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Twin Expected:</span>
                  <span className="font-mono text-slate-700">
                    {twinState.expected_ranges.temperature_c.expected.toFixed(1)} °C
                  </span>
                </div>
              </div>
            </div>

            {/* Current Residual */}
            <div className="industrial-card p-4">
              <div className="flex justify-between items-start text-xs mb-2">
                <span className="font-bold text-slate-700">Phase Current Residual</span>
                <span className="text-[10px] text-slate-400">Torque balance</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold font-mono text-slate-800">
                  {twinState.residual_deviations.current_residual_a > 0 ? "+" : ""}
                  {twinState.residual_deviations.current_residual_a.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">A dev</span>
              </div>
              <div className="text-xs space-y-1 pt-2 border-t border-slate-100 text-slate-500">
                <div className="flex justify-between">
                  <span>Observed:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {twinState.observed_values.current_a.toFixed(1)} A
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Twin Expected:</span>
                  <span className="font-mono text-slate-700">
                    {twinState.expected_ranges.current_a.expected.toFixed(1)} A
                  </span>
                </div>
              </div>
            </div>

            {/* Rotational Speed Residual */}
            <div className="industrial-card p-4">
              <div className="flex justify-between items-start text-xs mb-2">
                <span className="font-bold text-slate-700">Shaft RPM Residual</span>
                <span className="text-[10px] text-slate-400">Rotor Slip</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold font-mono text-slate-800">
                  {twinState.residual_deviations.speed_residual_rpm > 0 ? "+" : ""}
                  {twinState.residual_deviations.speed_residual_rpm.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">RPM dev</span>
              </div>
              <div className="text-xs space-y-1 pt-2 border-t border-slate-100 text-slate-500">
                <div className="flex justify-between">
                  <span>Observed:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {twinState.observed_values.speed_rpm.toFixed(1)} RPM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Twin Expected:</span>
                  <span className="font-mono text-slate-700">
                    {twinState.expected_ranges.speed_rpm.expected.toFixed(1)} RPM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tolerance Boundaries Table */}
          <div className="industrial-card p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              Digital Twin Physics Envelope vs Observed Operating Telemetry
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-2.5">Parameter</th>
                    <th className="p-2.5">Observed Live</th>
                    <th className="p-2.5">Expected Nominal</th>
                    <th className="p-2.5">Physics Envelope (Min - Max)</th>
                    <th className="p-2.5">Warning Threshold</th>
                    <th className="p-2.5">Critical Boundary</th>
                    <th className="p-2.5 text-right">Residual Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Vibration Velocity RMS</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">
                      {twinState.observed_values.vibration_rms_mms.toFixed(2)} mm/s
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">
                      {twinState.expected_ranges.vibration_rms_mms.expected.toFixed(2)} mm/s
                    </td>
                    <td className="p-2.5 font-mono text-slate-500">
                      [{twinState.expected_ranges.vibration_rms_mms.lower_bound} - {twinState.expected_ranges.vibration_rms_mms.upper_bound}] mm/s
                    </td>
                    <td className="p-2.5 font-mono text-amber-700">
                      {twinState.expected_ranges.vibration_rms_mms.warning_limit} mm/s
                    </td>
                    <td className="p-2.5 font-mono text-rose-700">
                      {twinState.expected_ranges.vibration_rms_mms.critical_limit} mm/s
                    </td>
                    <td className="p-2.5 text-right">
                      {Math.abs(twinState.residual_deviations.vib_residual_mms) > 1.2 ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded font-bold">ANOMALY</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">NOMINAL</span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Stator Temperature</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">
                      {twinState.observed_values.temperature_c.toFixed(1)} °C
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">
                      {twinState.expected_ranges.temperature_c.expected.toFixed(1)} °C
                    </td>
                    <td className="p-2.5 font-mono text-slate-500">
                      [{twinState.expected_ranges.temperature_c.lower_bound} - {twinState.expected_ranges.temperature_c.upper_bound}] °C
                    </td>
                    <td className="p-2.5 font-mono text-amber-700">
                      {twinState.expected_ranges.temperature_c.warning_limit} °C
                    </td>
                    <td className="p-2.5 font-mono text-rose-700">
                      {twinState.expected_ranges.temperature_c.critical_limit} °C
                    </td>
                    <td className="p-2.5 text-right">
                      {Math.abs(twinState.residual_deviations.temp_residual_c) > 6.0 ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded font-bold">ANOMALY</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">NOMINAL</span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Phase Current (RMS)</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">
                      {twinState.observed_values.current_a.toFixed(1)} A
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">
                      {twinState.expected_ranges.current_a.expected.toFixed(1)} A
                    </td>
                    <td className="p-2.5 font-mono text-slate-500">
                      [{twinState.expected_ranges.current_a.lower_bound} - {twinState.expected_ranges.current_a.upper_bound}] A
                    </td>
                    <td className="p-2.5 font-mono text-amber-700">
                      {twinState.expected_ranges.current_a.warning_limit} A
                    </td>
                    <td className="p-2.5 font-mono text-rose-700">
                      {twinState.expected_ranges.current_a.critical_limit} A
                    </td>
                    <td className="p-2.5 text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">NOMINAL</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Rotational Speed</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">
                      {twinState.observed_values.speed_rpm.toFixed(1)} RPM
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">
                      {twinState.expected_ranges.speed_rpm.expected.toFixed(1)} RPM
                    </td>
                    <td className="p-2.5 font-mono text-slate-500">
                      [{twinState.expected_ranges.speed_rpm.lower_bound} - {twinState.expected_ranges.speed_rpm.upper_bound}] RPM
                    </td>
                    <td className="p-2.5 font-mono text-amber-700">
                      {twinState.expected_ranges.speed_rpm.warning_limit} RPM
                    </td>
                    <td className="p-2.5 font-mono text-rose-700">
                      {twinState.expected_ranges.speed_rpm.critical_limit} RPM
                    </td>
                    <td className="p-2.5 text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">NOMINAL</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Calibration Panel & History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Iterative Calibration Control */}
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  Iterative Twin Dynamic Calibration
                </h3>
                <span className="text-xs font-mono text-slate-500">Current v{twinState.calibration_version}</span>
              </div>

              <p className="text-xs text-slate-500 mb-3">
                Calibrates baseline vibration coefficients and thermal inertia time constants (τ={twinState.thermal_time_constant_tau.toFixed(0)}s)
                against recent local operational telemetry without uploading raw data.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Calibration Context / Reason</label>
                  <input
                    type="text"
                    value={calibNotes}
                    onChange={(e) => setCalibNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Calibrated Baseline Vibration:</span>
                    <span className="font-mono font-bold text-slate-800">{twinState.baseline_vibration_rms} mm/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thermal Time Constant (τ):</span>
                    <span className="font-mono font-bold text-slate-800">{twinState.thermal_time_constant_tau} sec</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bearing Wear Factor (α):</span>
                    <span className="font-mono font-bold text-slate-800">{twinState.bearing_wear_factor.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCalibrate}
                  disabled={isCalibrating}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? "animate-spin" : ""}`} />
                  {isCalibrating ? "Calibrating..." : "Calibrate Digital Twin with Local Telemetry"}
                </button>
              </div>
            </div>

            {/* Calibration Audit Trail */}
            <div className="industrial-card p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Twin Calibration Audit History
              </h3>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {twinState.calibration_history.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                    <div className="flex items-center justify-between font-medium text-slate-800">
                      <span className="font-mono font-bold text-teal-700">v{item.version} Calibration</span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.timestamp}</span>
                    </div>
                    <div className="text-slate-600 mt-1">{item.notes}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Triggered by: {item.triggered_by}</div>
                  </div>
                ))}
              </div>

              {/* Assumptions vs Specifications Tag */}
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">Modeling Transparency:</span> Initial thermal resistances & cooling airflow
                are physics-informed assumptions calibrated from local operational evidence.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
