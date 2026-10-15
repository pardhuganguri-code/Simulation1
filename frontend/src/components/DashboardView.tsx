import React from "react";
import { FleetStatusResponse, FleetMachineSummary, UserRole } from "../types";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Flame,
  Layers,
  Share2,
  Wrench,
  ArrowRight,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

interface DashboardViewProps {
  status: FleetStatusResponse | null;
  onSelectMachine: (machineId: string, targetTab?: string) => void;
  userRole: UserRole;
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  onSelectMachine,
  userRole,
  onNavigate,
}) => {
  if (!status) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Activity className="w-6 h-6 animate-spin mr-2 text-teal-500" />
        Connecting to Industrial Telemetry Stream...
      </div>
    );
  }

  // Chart data for comparing current fleet operating conditions
  const comparisonData = status.machines.map((m) => ({
    name: m.machine_id,
    fullName: m.name,
    vibration: m.vibration_rms_mms,
    temperature: m.temperature_c,
    load: m.load_pct,
    health: m.health_index,
  }));

  const getStatusBadge = (machineStatus: string, riskCategory: string) => {
    if (riskCategory === "Critical") {
      return (
        <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-rose-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
          CRITICAL RISK
        </span>
      );
    }
    if (riskCategory === "High" || machineStatus === "Warning") {
      return (
        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          WARNING / ELEVATED
        </span>
      );
    }
    if (riskCategory === "Moderate" || machineStatus === "Attention Required") {
      return (
        <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-yellow-300">
          ATTENTION REQUIRED
        </span>
      );
    }
    return (
      <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-300 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        OPERATIONAL / HEALTHY
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between text-blue-900 text-xs gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded text-blue-700">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">Federated Star Architecture:</span> Every motor runs its own digital twin & isolated local data vault.
            The central coordinator only receives approved model weights during maintenance cycles.
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-[11px] text-blue-700 bg-white/80 px-2 py-1 rounded border border-blue-200">
          <span>Held-out Test F1:</span>
          <span className="font-bold text-teal-700">{(status.held_out_f1 * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Fleet KPI Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="industrial-card p-3">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Fleet Total</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-800">{status.total_machines}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">3-Phase Induction</div>
        </div>

        <div className="industrial-card p-3">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Healthy Motors</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{status.healthy_machines}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Normal vibration/temp</div>
        </div>

        <div className="industrial-card p-3">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Attention Req.</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-700">{status.machines_requiring_attention}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Moderate deviations</div>
        </div>

        <div className="industrial-card p-3">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Elevated Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-700">{status.machines_with_elevated_risk}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Failure probability elevated</div>
        </div>

        <div className="industrial-card p-3">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Pending Maint.</span>
            <Wrench className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-indigo-700">{status.pending_maintenance_count}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Inspections queued</div>
        </div>

        <div className="industrial-card p-3">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Pending FL Auth</span>
            <Share2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl font-bold text-teal-700">{status.pending_federated_updates}</div>
          <div className="text-[10px] text-teal-600 mt-0.5">Model updates awaiting review</div>
        </div>

        <div className="industrial-card p-3">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Global Model</span>
            <Zap className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-lg font-bold font-mono text-cyan-700">{status.latest_shared_model_version}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{status.aggregation_rounds_count} FedAvg rounds</div>
        </div>
      </div>

      {/* Fleet Equipment Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 m-0">Equipment Fleet Real-Time Condition</h2>
          <span className="text-xs text-slate-500">Click any machine for detailed sensor telemetry & digital twin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {status.machines.map((machine) => (
            <div
              key={machine.machine_id}
              className={`industrial-card p-4 transition-all hover:shadow-md cursor-pointer border-l-4 ${
                machine.risk_category === "Critical"
                  ? "border-l-rose-500"
                  : machine.risk_category === "High"
                  ? "border-l-amber-500"
                  : machine.risk_category === "Moderate"
                  ? "border-l-yellow-500"
                  : "border-l-emerald-500"
              }`}
              onClick={() => onSelectMachine(machine.machine_id, "twin")}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-500">{machine.machine_id}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{machine.name}</h3>
                </div>
                {getStatusBadge(machine.status, machine.risk_category)}
              </div>

              {/* Health Index Bar */}
              <div className="mt-3 mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Machine Health Index:</span>
                  <span className="font-bold font-mono text-slate-800">{machine.health_index.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      machine.health_index > 75
                        ? "bg-emerald-500"
                        : machine.health_index > 45
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(4, machine.health_index)}%` }}
                  ></div>
                </div>
              </div>

              {/* Live Parameters Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200/80">
                <div>
                  <span className="text-slate-500 block">Vibration RMS:</span>
                  <span
                    className={`font-mono font-bold ${
                      machine.vibration_rms_mms > 2.8 ? "text-rose-600" : "text-slate-800"
                    }`}
                  >
                    {machine.vibration_rms_mms.toFixed(2)} mm/s
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Temperature:</span>
                  <span
                    className={`font-mono font-bold ${
                      machine.temperature_c > 78.0 ? "text-rose-600" : "text-slate-800"
                    }`}
                  >
                    {machine.temperature_c.toFixed(1)} °C
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Current / Load:</span>
                  <span className="font-mono font-medium text-slate-700">
                    {machine.current_a.toFixed(1)}A ({machine.load_pct.toFixed(0)}%)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Local Model:</span>
                  <span className="font-mono font-medium text-teal-700">{machine.local_model_version}</span>
                </div>
              </div>

              {/* Abnormal Condition Warning if active */}
              {machine.abnormal_condition && (
                <div className="mt-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <span className="font-semibold capitalize">
                    {machine.abnormal_condition.replace("_", " ")} Simulated Active
                  </span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMachine(machine.machine_id, "sensors");
                  }}
                  className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
                >
                  Live Sensors <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMachine(machine.machine_id, "predictive");
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  Risk Assessment <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Comparison & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Vibration Comparison Chart */}
        <div className="lg:col-span-2 industrial-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Fleet Vibration Comparison vs ISO 10816-3</h3>
              <p className="text-xs text-slate-500">ISO Zone A/B (≤2.8 mm/s: Satisfactory), Zone C/D (&gt;4.5 mm/s: Unacceptable)</p>
            </div>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">Real-time</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis unit=" mm/s" domain={[0, 6]} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(val: any) => [`${val} mm/s`, "Vibration RMS"]}
                  labelFormatter={(name) => `Machine: ${name}`}
                />
                <ReferenceLine y={2.8} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Warning (2.8)", fill: "#d97706", fontSize: 10 }} />
                <ReferenceLine y={4.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Critical (4.5)", fill: "#dc2626", fontSize: 10 }} />
                <Bar dataKey="vibration" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Workflow Hub */}
        <div className="industrial-card p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Recommended Workflow Actions</h3>
            <p className="text-xs text-slate-500 mb-3">Current role: <span className="font-semibold text-teal-700">{userRole}</span></p>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigate("scenario")}
                className="w-full text-left p-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 transition flex items-center justify-between text-teal-900"
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    Run 3-Motor Guided Scenario
                  </div>
                  <div className="text-[11px] text-teal-700 mt-0.5">
                    Observe Motor B degradation, maintenance logging & federated aggregation.
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600 flex-shrink-0" />
              </button>

              <button
                onClick={() => onNavigate("federated")}
                className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-between text-slate-800"
              >
                <div>
                  <div className="font-bold">Federated Coordinator Station</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Review update authorization queue & trigger FedAvg aggregation.
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>

              <button
                onClick={() => onNavigate("privacy")}
                className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-between text-slate-800"
              >
                <div>
                  <div className="font-bold">Privacy & Governance Ledger</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Audit data boundary verification logs & zero-leak proof.
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Antigravity Industrial AI Engine • ISO 10816-3 Compliant
          </div>
        </div>
      </div>
    </div>
  );
};
