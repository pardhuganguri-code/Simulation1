import React, { useState, useEffect } from "react";
import { PredictiveAssessment, UserRole } from "../types";
import {
  BrainCircuit,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { fetchPredictiveMaintenance } from "../api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

interface PredictiveMaintenanceViewProps {
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  machineIds: string[];
  userRole: UserRole;
  onNavigateToMaintenance: (machineId: string) => void;
}

export const PredictiveMaintenanceView: React.FC<PredictiveMaintenanceViewProps> = ({
  selectedMachineId,
  onSelectMachine,
  machineIds,
  userRole,
  onNavigateToMaintenance,
}) => {
  const [assessment, setAssessment] = useState<PredictiveAssessment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAssessment = async () => {
    try {
      const data = await fetchPredictiveMaintenance(selectedMachineId);
      setAssessment(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadAssessment();
    const interval = setInterval(loadAssessment, 2500);
    return () => clearInterval(interval);
  }, [selectedMachineId]);

  if (isLoading && !assessment) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Activity className="w-6 h-6 animate-spin mr-2 text-teal-500" />
        Evaluating Local Predictive Model...
      </div>
    );
  }

  const getRiskColor = (category: string) => {
    switch (category) {
      case "Critical":
        return {
          bg: "bg-rose-500",
          text: "text-rose-700",
          border: "border-rose-300",
          bgLight: "bg-rose-50",
          badge: "bg-rose-100 text-rose-800 border-rose-300",
        };
      case "High":
        return {
          bg: "bg-amber-500",
          text: "text-amber-700",
          border: "border-amber-300",
          bgLight: "bg-amber-50",
          badge: "bg-amber-100 text-amber-800 border-amber-300",
        };
      case "Moderate":
        return {
          bg: "bg-yellow-500",
          text: "text-yellow-700",
          border: "border-yellow-300",
          bgLight: "bg-yellow-50",
          badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
        };
      default:
        return {
          bg: "bg-emerald-500",
          text: "text-emerald-700",
          border: "border-emerald-300",
          bgLight: "bg-emerald-50",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
        };
    }
  };

  const colors = assessment ? getRiskColor(assessment.risk_category) : getRiskColor("Low");

  return (
    <div className="space-y-6">
      {/* View Header & Machine Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Predictive Maintenance & Failure Risk Assessment</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Locally trained multiclass neural model evaluating physical telemetry and digital-twin residual deviations.
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

      {assessment && (
        <>
          {/* Main Assessment Header Card */}
          <div className={`industrial-card p-5 border-l-4 ${colors.border}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${colors.bgLight} ${colors.text} border ${colors.border}`}>
                  {assessment.risk_category === "Critical" ? (
                    <ShieldAlert className="w-7 h-7 animate-bounce" />
                  ) : assessment.risk_category === "High" ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <BrainCircuit className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{assessment.machine_id}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${colors.badge}`}>
                      {assessment.risk_category.toUpperCase()} FAILURE RISK
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Model {assessment.model_version}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    Overall Health Score: {assessment.health_index.toFixed(1)}%
                  </h3>
                </div>
              </div>

              {/* Numerical Risk & Confidence Interval */}
              <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 block">Failure Risk Probability</span>
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {(assessment.numerical_risk_score * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="border-l border-slate-200 pl-4">
                  <span className="text-[11px] text-slate-500 block">95% Uncertainty CI</span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    [{(assessment.confidence_interval[0] * 100).toFixed(1)}% - {(assessment.confidence_interval[1] * 100).toFixed(1)}%]
                  </span>
                </div>

                <div className="border-l border-slate-200 pl-4">
                  <span className="text-[11px] text-slate-500 block">Inspection Priority</span>
                  <span className={`text-xs font-bold ${colors.text}`}>
                    {assessment.recommended_priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Health Meter Progress Bar */}
            <div className="mb-2">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${colors.bg}`}
                  style={{ width: `${Math.max(5, assessment.health_index)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0% Critical Degradation</span>
                <span>50% Impending Maintenance</span>
                <span>100% Fully Nominal</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3 italic bg-slate-50 p-2.5 rounded border border-slate-200">
              {assessment.explanation}
            </p>
          </div>

          {/* Dual Panel: Potential Failure Modes vs Observed Physical Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Failure Modes Probability Breakdown */}
            <div className="industrial-card p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Multiclass Failure Mode Distribution
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Relative likelihood estimates derived from 8-dimensional operational feature vector.
              </p>

              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={assessment.potential_failure_modes}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis dataKey="mode" type="category" tick={{ fontSize: 11, fill: "#334155" }} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, "Severity / Likelihood"]}
                      contentStyle={{ backgroundColor: "#0f172a", color: "#fff", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="severity_score" radius={[0, 4, 4, 0]}>
                      {assessment.potential_failure_modes.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.severity_score > 60 ? "#ef4444" : entry.severity_score > 25 ? "#f59e0b" : "#0d9488"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                {assessment.potential_failure_modes.map((mode, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="font-medium text-slate-700">{mode.mode}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{(mode.probability * 100).toFixed(1)}%</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          mode.severity_score > 60
                            ? "bg-rose-100 text-rose-800"
                            : mode.severity_score > 20
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {mode.severity_score > 60 ? "Primary Threat" : mode.severity_score > 20 ? "Elevated" : "Low"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observed Physical Indicators & Evidence */}
            <div className="industrial-card p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Observable Sensor & Residual Evidence
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Specific telemetry markers and physics deviations triggering this risk classification.
                </p>

                <div className="space-y-2.5">
                  {assessment.observed_indicators.map((indicator, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                        indicator.includes("Elevated") || indicator.includes("High") || indicator.includes("Anomaly")
                          ? "bg-amber-50/70 border-amber-200 text-amber-900"
                          : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      }`}
                    >
                      <span className="mt-0.5">
                        {indicator.includes("Nominal") ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        )}
                      </span>
                      <span>{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Dispatch Maintenance */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => onNavigateToMaintenance(selectedMachineId)}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition"
                >
                  Log Maintenance Inspection for {selectedMachineId} <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-[11px] text-slate-400 text-center mt-2">
                  Academic Prototype: Predictions are probabilistic estimations; inspection confirms ground truth.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
