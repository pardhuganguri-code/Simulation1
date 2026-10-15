import React, { useState, useEffect } from "react";
import {
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Activity,
  Wrench,
  Share2,
  Zap,
} from "lucide-react";
import { fetchScenarioState, executeScenarioStep, resetScenario } from "../api";

interface ScenarioStepperProps {
  onStepComplete: () => void;
  onNavigateToTab: (tab: any) => void;
  onSelectMachine: (id: string) => void;
}

export const ScenarioStepper: React.FC<ScenarioStepperProps> = ({
  onStepComplete,
  onNavigateToTab,
  onSelectMachine,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [descriptions, setDescriptions] = useState<string[]>([]);

  const steps = [
    {
      num: 1,
      title: "Initialize 3 Motors & Digital Twins",
      summary: "Motor A, B, and C registered with isolated edge data stores and physics digital twins.",
      icon: <Cpu className="w-4 h-4" />,
      targetTab: "registry",
      targetMachine: "MTR-001",
    },
    {
      num: 2,
      title: "Stream Nominal Baseline Telemetry",
      summary: "Continuous simulated streaming. Vibration RMS ~1.1 mm/s and Stator Temp ~57°C.",
      icon: <Activity className="w-4 h-4" />,
      targetTab: "sensors",
      targetMachine: "MTR-001",
    },
    {
      num: 3,
      title: "Inject Controlled Bearing Degradation into Motor B",
      summary: "Subtle inner/outer raceway fatigue introduced. Acoustic emission rises; Motor A and C unaffected.",
      icon: <Activity className="w-4 h-4 text-rose-500" />,
      targetTab: "sensors",
      targetMachine: "MTR-002",
    },
    {
      num: 4,
      title: "Digital Twin Residual Anomaly Detection",
      summary: "Motor B's digital twin flags +3.2 mm/s vibration deviation above physics expectation.",
      icon: <Activity className="w-4 h-4 text-amber-500" />,
      targetTab: "twin",
      targetMachine: "MTR-002",
    },
    {
      num: 5,
      title: "Local Predictive Model Flags Elevated Risk",
      summary: "Local neural model detects impending Bearing Wear failure (85% probability) with High priority.",
      icon: <Activity className="w-4 h-4 text-rose-600" />,
      targetTab: "predictive",
      targetMachine: "MTR-002",
    },
    {
      num: 6,
      title: "Technician Logs Corrective Maintenance",
      summary: "Inspection confirms spalling on NU 314 bearing. Replaced with SKF ECP; saved into local vault.",
      icon: <Wrench className="w-4 h-4 text-indigo-500" />,
      targetTab: "maintenance",
      targetMachine: "MTR-002",
    },
    {
      num: 7,
      title: "Local Model Trains & Prepares Certified Update",
      summary: "Local model learns from ground-truth failure cycle. Deep inspection verifies 0 raw sensor records leaked.",
      icon: <ShieldCheck className="w-4 h-4 text-teal-600" />,
      targetTab: "maintenance",
      targetMachine: "MTR-002",
    },
    {
      num: 8,
      title: "System Admin Authorizes Model Update",
      summary: "Administrator audits cryptographic checksum and approves update for coordinator aggregation.",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      targetTab: "federated",
      targetMachine: "MTR-002",
    },
    {
      num: 9,
      title: "Coordinator Executes Federated Averaging (FedAvg)",
      summary: "FedAvg merges approved weight tensors into Global Model v1.1.0; evaluated on held-out test suite.",
      icon: <Zap className="w-4 h-4 text-cyan-600" />,
      targetTab: "federated",
      targetMachine: "MTR-002",
    },
    {
      num: 10,
      title: "Distribute Shared Model Across Fleet",
      summary: "New shared intelligence distributed to Motors A, B, and C while preserving individual twin calibrations!",
      icon: <Share2 className="w-4 h-4 text-teal-600" />,
      targetTab: "evaluation",
      targetMachine: "MTR-001",
    },
  ];

  const loadScenario = async () => {
    try {
      const data = await fetchScenarioState();
      setCurrentStep(data.current_step || 1);
      setDescriptions(data.step_descriptions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadScenario();
  }, []);

  const handleStepTo = async (stepNum: number) => {
    setIsExecuting(true);
    try {
      await executeScenarioStep(stepNum);
      setCurrentStep(stepNum);
      onStepComplete();
      const st = steps[stepNum - 1];
      if (st) {
        onSelectMachine(st.targetMachine);
        onNavigateToTab(st.targetTab);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = async () => {
    setIsExecuting(true);
    try {
      await resetScenario();
      setCurrentStep(1);
      onStepComplete();
      onSelectMachine("MTR-001");
      onNavigateToTab("dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  const activeStep = steps[currentStep - 1] || steps[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">3-Machine Interactive Demonstration Walkthrough</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step through the end-to-end lifecycle: edge digital twin initialization, controlled fault degradation, local model learning, and privacy-preserving federated aggregation.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isExecuting}
          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Demonstration to Step 1
        </button>
      </div>

      {/* Stepper Progress Visualizer */}
      <div className="industrial-card p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-md font-mono text-xs font-bold border border-teal-500/30">
              STEP {currentStep} OF 10
            </span>
            <span className="text-sm font-bold text-white">{activeStep.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStepTo(Math.max(1, currentStep - 1))}
              disabled={isExecuting || currentStep <= 1}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => handleStepTo(Math.min(10, currentStep + 1))}
              disabled={isExecuting || currentStep >= 10}
              className="px-3.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded text-xs flex items-center gap-1 disabled:opacity-40 shadow-xs"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Indicator Circles */}
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 my-4">
          {steps.map((st) => {
            const isCompleted = st.num < currentStep;
            const isCurrent = st.num === currentStep;
            return (
              <button
                key={st.num}
                onClick={() => handleStepTo(st.num)}
                disabled={isExecuting}
                className={`p-2 rounded-lg text-center transition flex flex-col items-center justify-center border ${
                  isCurrent
                    ? "bg-teal-600 border-teal-400 text-white shadow-sm ring-2 ring-teal-400/50"
                    : isCompleted
                    ? "bg-slate-800/90 border-slate-700 text-teal-300 hover:bg-slate-700"
                    : "bg-slate-900/60 border-slate-800 text-slate-500 hover:bg-slate-800"
                }`}
              >
                <div className="font-mono text-xs font-bold">{st.num}</div>
                <div className="text-[10px] truncate max-w-full mt-0.5 opacity-90">
                  {st.num === 1 && "Init"}
                  {st.num === 2 && "Stream"}
                  {st.num === 3 && "Degrade B"}
                  {st.num === 4 && "Twin Residual"}
                  {st.num === 5 && "Risk Alert"}
                  {st.num === 6 && "Maintain"}
                  {st.num === 7 && "Local Train"}
                  {st.num === 8 && "Admin Auth"}
                  {st.num === 9 && "FedAvg"}
                  {st.num === 10 && "Distribute"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Explanation */}
        <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-700/80 mt-3 text-xs">
          <div className="font-bold text-teal-300 text-sm mb-1">{activeStep.title}</div>
          <p className="text-slate-300 leading-relaxed">{activeStep.summary}</p>
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Target Machine: <strong className="text-white font-mono">{activeStep.targetMachine}</strong></span>
            <button
              onClick={() => {
                onSelectMachine(activeStep.targetMachine);
                onNavigateToTab(activeStep.targetTab);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
            >
              Inspect {activeStep.targetTab.toUpperCase()} View <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Motors Overview in Current Step State */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Motor A Card */}
        <div className="industrial-card p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono font-bold text-slate-700">MTR-001</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
              NORMAL BASELINE
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Feed Water Pump Motor A</h4>
          <p className="text-xs text-slate-500 mt-1">
            Operates steadily under healthy conditions. Provides normal operating samples for contrast.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-mono text-slate-600 space-y-1">
            <div>Vibration RMS: ~1.1 mm/s (Healthy)</div>
            <div>Digital Twin Residual: ~0.0 mm/s</div>
            <div>Model Version: Current Global</div>
          </div>
        </div>

        {/* Motor B Card */}
        <div className="industrial-card p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono font-bold text-slate-700">MTR-002</span>
            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold text-[10px]">
              DEGRADATION SCENARIO
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Cooling Tower Fan Drive B</h4>
          <p className="text-xs text-slate-500 mt-1">
            Experiences progressive outer raceway fatigue. Digital twin detects residual anomaly; local model triggers update.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-mono text-slate-600 space-y-1">
            <div>Fault Mode: Cylindrical Roller Bearing Wear</div>
            <div>Vibration RMS: Climbs to ~3.8 mm/s</div>
            <div>Maintenance: Replaced NU 314 bearing</div>
          </div>
        </div>

        {/* Motor C Card */}
        <div className="industrial-card p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono font-bold text-slate-700">MTR-003</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[10px]">
              VARIABLE LOAD PROFILE
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Reciprocating Compressor Motor C</h4>
          <p className="text-xs text-slate-500 mt-1">
            Heavy 90kW motor with routine semi-annual grease replenishment history. Participates in federated distribution.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-mono text-slate-600 space-y-1">
            <div>Power / Voltage: 90kW / 400V</div>
            <div>Bearing: Spherical Roller 22218</div>
            <div>Independent Digital Twin: TWIN-MTR-003</div>
          </div>
        </div>
      </div>
    </div>
  );
};
