import React, { useState, useEffect } from "react";
import { SensorReading, UserRole } from "../types";
import {
  Gauge,
  Activity,
  Flame,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Zap,
  Radio,
  StepForward,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { fetchMachineSensors, injectAbnormalCondition, controlSimulation } from "../api";

interface SensorMonitoringViewProps {
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  machineIds: string[];
  userRole: UserRole;
}

export const SensorMonitoringView: React.FC<SensorMonitoringViewProps> = ({
  selectedMachineId,
  onSelectMachine,
  machineIds,
  userRole,
}) => {
  const [sensorData, setSensorData] = useState<{
    latest: SensorReading | null;
    history: SensorReading[];
    limits: any;
    abnormal_condition?: string | null;
  }>({
    latest: null,
    history: [],
    limits: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [selectedCondition, setSelectedCondition] = useState<string>("bearing_fault");
  const [severity, setSeverity] = useState<number>(0.75);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadSensors = async () => {
    try {
      const data = await fetchMachineSensors(selectedMachineId);
      setSensorData({
        latest: data.latest,
        history: data.history,
        limits: data.limits,
        abnormal_condition: data.abnormal_condition,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadSensors();
    const interval = setInterval(loadSensors, 2000);
    return () => clearInterval(interval);
  }, [selectedMachineId]);

  const handleInjectFault = async (condition: string | null) => {
    try {
      await injectAbnormalCondition(selectedMachineId, condition, severity);
      if (condition) {
        setActionFeedback(`Injected '${condition.replace("_", " ")}' into ${selectedMachineId} at severity ${(severity * 100).toFixed(0)}%.`);
      } else {
        setActionFeedback(`Cleared faults on ${selectedMachineId}. Restoring nominal baseline.`);
      }
      await loadSensors();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const handleSimAction = async (action: "start" | "pause" | "reset" | "step") => {
    try {
      await controlSimulation(selectedMachineId, action);
      if (action === "start") setIsSimRunning(true);
      if (action === "pause") setIsSimRunning(false);
      await loadSensors();
    } catch (err) {
      console.error(err);
    }
  };

  const latest = sensorData.latest;

  return (
    <div className="space-y-6">
      {/* View Header & Machine Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Real-Time Sensor Telemetry Stream</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous vibration velocity RMS, acoustic peak-to-peak, stator RTD temperatures, and load dynamics.
          </p>
        </div>

        {/* Machine Picker Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Machine Node:</span>
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

      {actionFeedback && (
        <div className="p-3 bg-teal-50 border border-teal-300 text-teal-800 text-xs rounded-lg flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="font-bold text-teal-600">×</button>
        </div>
      )}

      {/* Live Telemetry Gauges Banner */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Vibration RMS */}
          <div className="industrial-card p-3">
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Vibration RMS</span>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-xl font-bold font-mono ${
                  latest.vibration_rms_mms > 2.8 ? "text-rose-600 animate-pulse" : "text-slate-800"
                }`}
              >
                {latest.vibration_rms_mms.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">mm/s</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Warning Limit: {sensorData.limits?.warning_vibration_rms_mms || 2.8} mm/s
            </div>
          </div>

          {/* Vibration P2P */}
          <div className="industrial-card p-3">
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Peak-to-Peak</span>
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-xl font-bold font-mono ${
                  latest.vibration_peak_to_peak > 9.0 ? "text-rose-600" : "text-slate-800"
                }`}
              >
                {latest.vibration_peak_to_peak.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">mm/s</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Impact Crest: {(latest.vibration_peak_to_peak / Math.max(0.1, latest.vibration_rms_mms)).toFixed(1)}x
            </div>
          </div>

          {/* Stator Temp */}
          <div className="industrial-card p-3">
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Stator Temp</span>
              <Flame className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-xl font-bold font-mono ${
                  latest.temperature_c > 78.0 ? "text-rose-600" : "text-slate-800"
                }`}
              >
                {latest.temperature_c.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-400">°C</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Limit: {sensorData.limits?.max_temperature_c || 90.0} °C
            </div>
          </div>

          {/* Phase Current */}
          <div className="industrial-card p-3">
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Current RMS</span>
              <Zap className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-800">
                {latest.current_a.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-400">A</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Load: {latest.load_pct.toFixed(0)}% Rated
            </div>
          </div>

          {/* Shaft Speed */}
          <div className="industrial-card p-3">
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Rotor Speed</span>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-800">
                {latest.speed_rpm.toFixed(0)}
              </span>
              <span className="text-[11px] text-slate-400">RPM</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Sync: 1500 RPM (50Hz)
            </div>
          </div>

          {/* Sensor Availability */}
          <div className="industrial-card p-3 bg-emerald-50/50 border-emerald-200">
            <div className="text-[11px] text-emerald-800 font-medium flex items-center justify-between">
              <span>Sensor Health</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold font-mono text-emerald-700">100% Good</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              4/4 Nodes Active
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid: Time Series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vibration Time Series Chart */}
        <div className="industrial-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Vibration Velocity Trend (mm/s RMS)</h3>
              <p className="text-[11px] text-slate-500">ISO 10816-3 Warning Threshold (2.8) & Critical (4.5)</p>
            </div>
            <span className="font-mono text-xs text-slate-400">Local Buffer</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData.history} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis unit=" mm/s" domain={[0, 6]} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(val: any) => [`${val} mm/s`, "Vibration RMS"]}
                  contentStyle={{ backgroundColor: "#0f172a", color: "#fff", borderRadius: 8, fontSize: 12 }}
                />
                <ReferenceLine y={2.8} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Warning (2.8)", fill: "#d97706", fontSize: 10 }} />
                <ReferenceLine y={4.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Trip (4.5)", fill: "#dc2626", fontSize: 10 }} />
                <Line type="monotone" dataKey="vibration_rms_mms" stroke="#0d9488" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Time Series Chart */}
        <div className="industrial-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Stator Winding Temperature Trend (°C)</h3>
              <p className="text-[11px] text-slate-500">IEC 60034 Thermal Class Warning (78°C) & Trip Limit (90°C)</p>
            </div>
            <span className="font-mono text-xs text-slate-400">PT100 Sensor</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData.history} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis unit=" °C" domain={[20, 105]} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(val: any) => [`${val} °C`, "Stator Temp"]}
                  contentStyle={{ backgroundColor: "#0f172a", color: "#fff", borderRadius: 8, fontSize: 12 }}
                />
                <ReferenceLine y={78.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Warning (78°C)", fill: "#d97706", fontSize: 10 }} />
                <ReferenceLine y={90.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Trip (90°C)", fill: "#dc2626", fontSize: 10 }} />
                <Line type="monotone" dataKey="temperature_c" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Controlled Simulation & Fault Injection Laboratory */}
      <div className="industrial-card p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-700 pb-4 mb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/20 text-teal-400 p-1.5 rounded-lg border border-teal-500/30">
                <Sliders className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white">Controlled Industrial Fault Injection Panel</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Reproducibly introduce physical motor degradation into <span className="text-teal-300 font-mono font-bold">{selectedMachineId}</span> to test local digital twin detection & predictive maintenance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSimAction("step")}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded flex items-center gap-1.5 transition"
            >
              <StepForward className="w-3.5 h-3.5 text-teal-400" />
              Step Forward (1s)
            </button>
            <button
              onClick={() => handleSimAction(isSimRunning ? "pause" : "start")}
              className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 transition ${
                isSimRunning ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isSimRunning ? "Pause Stream" : "Resume Stream"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Fault Category Selector */}
          <div>
            <label className="block text-slate-400 mb-2 font-medium">Select Controlled Anomaly Mode:</label>
            <div className="space-y-2">
              {[
                { id: "bearing_fault", label: "Bearing Raceway Flaking (BPFO/BPFI)", desc: "Elevated high-frequency vibration RMS & impact crest factor" },
                { id: "overheating", label: "Stator Winding Overheating", desc: "Ventilation restriction, thermal rise past 80°C" },
                { id: "load_imbalance", label: "Mechanical Unbalance & Misalignment", desc: "1x rotational speed harmonic vibration spike" },
              ].map((fault) => (
                <div
                  key={fault.id}
                  onClick={() => setSelectedCondition(fault.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                    selectedCondition === fault.id
                      ? "bg-teal-900/50 border-teal-500 text-white"
                      : "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{fault.label}</span>
                    {selectedCondition === fault.id && <span className="w-2 h-2 rounded-full bg-teal-400"></span>}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{fault.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Slider */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-400 font-medium">Fault Severity Intensity:</label>
                <span className="font-mono text-teal-400 font-bold">{(severity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={severity}
                onChange={(e) => setSeverity(parseFloat(e.target.value))}
                className="w-full accent-teal-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Subtle (20%)</span>
                <span>Moderate (60%)</span>
                <span>Severe Degradation (100%)</span>
              </div>
            </div>

            <div className="bg-slate-800/90 p-3 rounded-lg border border-slate-700/80 space-y-1 text-[11px] text-slate-400 mt-4">
              <div className="text-slate-300 font-bold mb-1">Current State:</div>
              {sensorData.abnormal_condition ? (
                <span className="text-rose-400 font-bold capitalize flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  Active Fault: {sensorData.abnormal_condition.replace("_", " ")}
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Nominal Baseline Condition
                </span>
              )}
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col justify-end space-y-3">
            <button
              onClick={() => handleInjectFault(selectedCondition)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Flame className="w-4 h-4" />
              Inject Anomaly into {selectedMachineId}
            </button>

            <button
              onClick={() => handleInjectFault(null)}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              Clear Fault & Restore Nominal
            </button>

            <div className="text-[10px] text-slate-400 text-center">
              Reproducibility Guarantee: Injected states evolve deterministically through differential physics equations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
