import React from "react";
import {
  LayoutDashboard,
  Boxes,
  Activity,
  Gauge,
  BrainCircuit,
  Wrench,
  Share2,
  ShieldCheck,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "registry"
  | "twin"
  | "sensors"
  | "predictive"
  | "maintenance"
  | "federated"
  | "privacy"
  | "evaluation"
  | "scenario";

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingUpdatesCount: number;
  pendingMaintenanceCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingUpdatesCount,
  pendingMaintenanceCount,
}) => {
  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }> = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "registry", label: "Equipment Registry", icon: <Boxes className="w-4 h-4" /> },
    { id: "twin", label: "Digital Twin", icon: <Activity className="w-4 h-4" /> },
    { id: "sensors", label: "Sensor Monitoring", icon: <Gauge className="w-4 h-4" /> },
    { id: "predictive", label: "Predictive Maintenance", icon: <BrainCircuit className="w-4 h-4" /> },
    {
      id: "maintenance",
      label: "Maintenance Workflow",
      icon: <Wrench className="w-4 h-4" />,
      badge: pendingMaintenanceCount > 0 ? pendingMaintenanceCount : undefined,
      badgeColor: "bg-amber-500",
    },
    {
      id: "federated",
      label: "Federated Learning Centre",
      icon: <Share2 className="w-4 h-4" />,
      badge: pendingUpdatesCount > 0 ? pendingUpdatesCount : undefined,
      badgeColor: "bg-teal-500",
    },
    { id: "privacy", label: "Privacy & Governance", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "evaluation", label: "Model Evaluation", icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: "scenario", label: "3-Motor Walkthrough", icon: <PlayCircle className="w-4 h-4" />, badgeColor: "bg-blue-500" },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4">
      <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto scrollbar-none py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors relative ${
                isActive
                  ? "bg-slate-800 text-teal-400 font-semibold border-b-2 border-teal-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`${
                    tab.badgeColor || "bg-teal-500"
                  } text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
