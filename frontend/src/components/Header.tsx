import React from "react";
import { UserRole } from "../types";
import { ShieldCheck, UserCheck, HardHat, Cpu, RefreshCw, AlertCircle, Database } from "lucide-react";

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  modelVersion: string;
  isBackendConnected: boolean;
  onManualRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  modelVersion,
  isBackendConnected,
  onManualRefresh,
  isRefreshing,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      {/* Top Industrial Assurance Strip */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800 flex flex-wrap justify-between items-center text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FEDERATED STAR TOPOLOGY ACTIVE
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-cyan-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            RAW OPERATIONAL SENSOR DATA REMAINS 100% LOCAL
          </span>
          <span className="text-slate-600">|</span>
          <span className="hidden md:inline text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 font-mono">
            ACADEMIC RESEARCH PROTOTYPE (SIMULATION-GROUNDED)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Backend API:</span>
            {isBackendConnected ? (
              <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Connected (127.0.0.1:8000)
              </span>
            ) : (
              <span className="text-rose-400 font-mono font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Offline
              </span>
            )}
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-slate-300">
            <span>Global Model:</span>
            <span className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold">
              {modelVersion}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-2 rounded-lg text-white shadow-sm ring-1 ring-teal-400/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white m-0 p-0">
                Machine Pulse
              </h1>
              <span className="bg-teal-900/80 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-700/60 uppercase tracking-wider">
                Federated Privacy
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Edge Digital Twins • Local Model Training • Central Federated Aggregation (FedAvg)
            </p>
          </div>
        </div>

        {/* Role Switcher & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/80">
            <span className="text-xs font-medium text-slate-400 px-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              Role:
            </span>
            {(["Plant Manager", "Maintenance Technician", "System Administrator"] as UserRole[]).map((role) => {
              const isActive = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => onRoleChange(role)}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                  }`}
                  title={`Simulate perspective of ${role}`}
                >
                  {role === "Plant Manager" && "Manager"}
                  {role === "Maintenance Technician" && "Technician"}
                  {role === "System Administrator" && "Admin"}
                </button>
              );
            })}
          </div>

          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition flex items-center justify-center disabled:opacity-50"
            title="Poll Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
