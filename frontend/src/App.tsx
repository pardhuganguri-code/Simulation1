import React, { useState, useEffect } from "react";
import { UserRole, FleetStatusResponse, EquipmentRecord } from "./types";
import { fetchFleetStatus, fetchAllMachines } from "./api";
import { Header } from "./components/Header";
import { Navigation, NavTab } from "./components/Navigation";
import { DashboardView } from "./components/DashboardView";
import { EquipmentRegistryView } from "./components/EquipmentRegistryView";
import { DigitalTwinView } from "./components/DigitalTwinView";
import { SensorMonitoringView } from "./components/SensorMonitoringView";
import { PredictiveMaintenanceView } from "./components/PredictiveMaintenanceView";
import { MaintenanceManagementView } from "./components/MaintenanceManagementView";
import { FederatedLearningView } from "./components/FederatedLearningView";
import { PrivacyGovernanceView } from "./components/PrivacyGovernanceView";
import { ModelEvaluationView } from "./components/ModelEvaluationView";
import { ScenarioStepper } from "./components/ScenarioStepper";
import { AlertCircle, RefreshCw } from "lucide-react";

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>("Plant Manager");
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [selectedMachineId, setSelectedMachineId] = useState<string>("MTR-001");
  const [fleetStatus, setFleetStatus] = useState<FleetStatusResponse | null>(null);
  const [machines, setMachines] = useState<EquipmentRecord[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadFleetData = async () => {
    try {
      const [status, machineList] = await Promise.all([
        fetchFleetStatus(),
        fetchAllMachines(),
      ]);
      setFleetStatus(status);
      setMachines(machineList);
      setIsBackendConnected(true);
    } catch (err) {
      console.warn("Backend poll error:", err);
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
    loadFleetData();
    const interval = setInterval(loadFleetData, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadFleetData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSelectMachine = (machineId: string, targetTab?: string) => {
    setSelectedMachineId(machineId);
    if (targetTab) {
      setActiveTab(targetTab as NavTab);
    }
  };

  const machineIds = machines.length > 0
    ? machines.map((m) => m.machine_id)
    : ["MTR-001", "MTR-002", "MTR-003"];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Role-Aware Global Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        modelVersion={fleetStatus?.latest_shared_model_version || "v1.0.0"}
        isBackendConnected={isBackendConnected}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Navigation Tabs Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingUpdatesCount={fleetStatus?.pending_federated_updates || 0}
        pendingMaintenanceCount={fleetStatus?.pending_maintenance_count || 0}
      />

      {/* Backend Offline Warning Banner if needed */}
      {!isBackendConnected && (
        <div className="bg-rose-600 text-white text-xs px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>FastAPI backend not detected at http://127.0.0.1:8000. Reconnecting...</span>
          </div>
          <button
            onClick={handleManualRefresh}
            className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded font-semibold text-white"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === "dashboard" && (
          <DashboardView
            status={fleetStatus}
            onSelectMachine={handleSelectMachine}
            userRole={currentRole}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "registry" && (
          <EquipmentRegistryView
            machines={machines}
            onSelectMachine={handleSelectMachine}
            userRole={currentRole}
            onRefresh={loadFleetData}
          />
        )}

        {activeTab === "twin" && (
          <DigitalTwinView
            selectedMachineId={selectedMachineId}
            onSelectMachine={setSelectedMachineId}
            machineIds={machineIds}
            userRole={currentRole}
          />
        )}

        {activeTab === "sensors" && (
          <SensorMonitoringView
            selectedMachineId={selectedMachineId}
            onSelectMachine={setSelectedMachineId}
            machineIds={machineIds}
            userRole={currentRole}
          />
        )}

        {activeTab === "predictive" && (
          <PredictiveMaintenanceView
            selectedMachineId={selectedMachineId}
            onSelectMachine={setSelectedMachineId}
            machineIds={machineIds}
            userRole={currentRole}
            onNavigateToMaintenance={(mId) => {
              setSelectedMachineId(mId);
              setActiveTab("maintenance");
            }}
          />
        )}

        {activeTab === "maintenance" && (
          <MaintenanceManagementView
            selectedMachineId={selectedMachineId}
            onSelectMachine={setSelectedMachineId}
            machineIds={machineIds}
            userRole={currentRole}
            onNavigateToFederated={() => setActiveTab("federated")}
          />
        )}

        {activeTab === "federated" && (
          <FederatedLearningView
            userRole={currentRole}
            onRefreshFleet={loadFleetData}
          />
        )}

        {activeTab === "privacy" && (
          <PrivacyGovernanceView userRole={currentRole} />
        )}

        {activeTab === "evaluation" && (
          <ModelEvaluationView userRole={currentRole} />
        )}

        {activeTab === "scenario" && (
          <ScenarioStepper
            onStepComplete={loadFleetData}
            onNavigateToTab={setActiveTab}
            onSelectMachine={setSelectedMachineId}
          />
        )}
      </main>

      {/* Industrial Platform Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-white">Federated-Privacy Machine Pulse for Manufacturing</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Academic Research & Engineering Simulation • ISO 10816-3 & IEC 60034 Standards
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400 font-mono">● Zero-Raw-Data Locality Enforced</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono">● FedAvg Aggregator Active</span>
            <span>•</span>
            <span className="text-slate-500">v1.0.0 Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
