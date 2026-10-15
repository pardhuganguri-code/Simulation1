import React, { useState } from "react";
import { EquipmentRecord, UserRole } from "../types";
import { Boxes, Plus, CheckCircle, FileText, Database, Activity, Cpu, ShieldCheck, ChevronRight } from "lucide-react";
import { registerMachine } from "../api";

interface EquipmentRegistryViewProps {
  machines: EquipmentRecord[];
  onSelectMachine: (machineId: string, tab?: string) => void;
  userRole: UserRole;
  onRefresh: () => void;
}

export const EquipmentRegistryView: React.FC<EquipmentRegistryViewProps> = ({
  machines,
  onSelectMachine,
  userRole,
  onRefresh,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.machine_id || "MTR-001");
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Equipment Form State
  const [formData, setFormData] = useState({
    machine_id: `MTR-00${machines.length + 1}`,
    name: "",
    manufacturer: "",
    model_number: "",
    power_kw: 45.0,
    voltage_v: 400.0,
    current_a: 85.0,
    speed_rpm: 1480.0,
    bearing_type: "Deep Groove Ball 6314",
    insulation_class: "Class F (155°C max)",
    warning_temp: 78.0,
    max_temp: 90.0,
    warning_vib: 2.8,
    max_vib: 4.5,
  });

  const selectedRecord = machines.find((m) => m.machine_id === selectedMachineId) || machines[0];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.manufacturer || !formData.model_number) {
      setFormError("Please fill out all required equipment specification fields.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      const record: EquipmentRecord = {
        machine_id: formData.machine_id,
        name: formData.name,
        category: "Industrial Electric Motor",
        manufacturer: formData.manufacturer,
        model_number: formData.model_number,
        technical_specs: {
          rated_power_kw: formData.power_kw,
          rated_voltage_v: formData.voltage_v,
          rated_current_a: formData.current_a,
          rated_speed_rpm: formData.speed_rpm,
          poles: 4,
          bearing_type: formData.bearing_type,
          insulation_class: formData.insulation_class,
        },
        operating_limits: {
          max_temperature_c: formData.max_temp,
          warning_temperature_c: formData.warning_temp,
          max_vibration_rms_mms: formData.max_vib,
          warning_vibration_rms_mms: formData.warning_vib,
          max_current_a: formData.current_a * 1.15,
        },
        installation_date: new Date().toISOString().split("T")[0],
        datasheet_reference: `DOC-${formData.manufacturer.toUpperCase()}-${formData.model_number}.pdf`,
        historical_data_reference: `LOCAL_VAULT://${formData.machine_id}/history.db`,
        sensor_configuration: [
          "Triaxial Accelerometer",
          "PT100 Winding RTD",
          "Hall-effect Current CT",
          "Optical Tachometer",
        ],
        current_status: "Operational",
        last_maintenance_date: new Date().toISOString().split("T")[0],
        twin_id: `TWIN-${formData.machine_id}`,
        local_model_id: `LMDL-${formData.machine_id}`,
        current_local_model_version: "v1.0.0",
        is_simulation_running: true,
      };

      await registerMachine(record);
      setShowRegisterModal(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || "Failed to register machine.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Equipment Registry & Specifications</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage industrial motor assets, technical datasheets, operating limits, and local edge twin identifiers.
          </p>
        </div>

        {userRole === "System Administrator" && (
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Register Equipment
          </button>
        )}
      </div>

      {/* Main Grid: Machine List on Left, Selected Machine Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Registered Industrial Motors ({machines.length})
          </div>

          <div className="space-y-2">
            {machines.map((m) => {
              const isSelected = m.machine_id === selectedMachineId;
              return (
                <div
                  key={m.machine_id}
                  onClick={() => setSelectedMachineId(m.machine_id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-teal-50/70 border-teal-500 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{m.machine_id}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {m.technical_specs.rated_power_kw} kW
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{m.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.manufacturer} • {m.model_number}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? "text-teal-600" : "text-slate-400"}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Machine Full Dossier */}
        {selectedRecord && (
          <div className="lg:col-span-2 space-y-4">
            {/* Top Identity Card */}
            <div className="industrial-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-teal-100 text-teal-800 font-mono text-xs font-bold px-2.5 py-0.5 rounded">
                      {selectedRecord.machine_id}
                    </span>
                    <span className="text-xs text-slate-500">Installed: {selectedRecord.installation_date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedRecord.name}</h3>
                  <div className="text-xs text-slate-500">{selectedRecord.category} • {selectedRecord.manufacturer}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectMachine(selectedRecord.machine_id, "twin")}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-200 flex items-center gap-1 transition"
                  >
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    Open Digital Twin
                  </button>
                  <button
                    onClick={() => onSelectMachine(selectedRecord.machine_id, "sensors")}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium rounded border border-teal-200 flex items-center gap-1 transition"
                  >
                    <Cpu className="w-3.5 h-3.5 text-teal-600" />
                    Sensor Stream
                  </button>
                </div>
              </div>

              {/* Technical Specifications Table */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Technical Datasheet Specifications
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block">Rated Power:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedRecord.technical_specs.rated_power_kw} kW</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Rated Speed:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedRecord.technical_specs.rated_speed_rpm} RPM</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Rated Current:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedRecord.technical_specs.rated_current_a} A</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Voltage:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedRecord.technical_specs.rated_voltage_v} V</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Bearing Type:</span>
                    <span className="font-medium text-slate-800">{selectedRecord.technical_specs.bearing_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Insulation Class:</span>
                    <span className="font-medium text-slate-800">{selectedRecord.technical_specs.insulation_class}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Poles / Frequency:</span>
                    <span className="font-mono font-medium text-slate-800">{selectedRecord.technical_specs.poles} Poles (50 Hz)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Datasheet Ref:</span>
                    <span className="font-mono text-[11px] text-teal-700 underline truncate block">
                      {selectedRecord.datasheet_reference}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operating Limits & Thresholds */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Configured Operating Limits (ISO 10816-3 & IEC 60034)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
                    <span className="text-amber-800 font-bold block mb-1">Temperature Limits</span>
                    <div className="flex justify-between text-slate-600">
                      <span>Warning:</span>
                      <span className="font-mono font-bold text-amber-700">{selectedRecord.operating_limits.warning_temperature_c} °C</span>
                    </div>
                    <div className="flex justify-between text-slate-600 mt-1">
                      <span>Critical Trip:</span>
                      <span className="font-mono font-bold text-rose-700">{selectedRecord.operating_limits.max_temperature_c} °C</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                    <span className="text-blue-800 font-bold block mb-1">Vibration Limits (RMS)</span>
                    <div className="flex justify-between text-slate-600">
                      <span>Zone B/C Warning:</span>
                      <span className="font-mono font-bold text-amber-700">{selectedRecord.operating_limits.warning_vibration_rms_mms} mm/s</span>
                    </div>
                    <div className="flex justify-between text-slate-600 mt-1">
                      <span>Zone C/D Alarm:</span>
                      <span className="font-mono font-bold text-rose-700">{selectedRecord.operating_limits.max_vibration_rms_mms} mm/s</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-700 font-bold block mb-1">Electrical Current</span>
                    <div className="flex justify-between text-slate-600">
                      <span>Maximum Allowable:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedRecord.operating_limits.max_current_a} A</span>
                    </div>
                    <div className="flex justify-between text-slate-600 mt-1">
                      <span>Service Factor:</span>
                      <span className="font-mono font-medium text-slate-700">1.15 continuous</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Local Storage & Edge ML Identity */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  Edge Privacy & Data Governance Bounds
                </h4>

                <div className="p-3 bg-slate-900 text-slate-300 rounded-lg text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Local Isolated Storage Vault:</span>
                    <span className="text-cyan-400">{selectedRecord.historical_data_reference}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Digital Twin Unique ID:</span>
                    <span className="text-teal-400">{selectedRecord.twin_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Local Predictive Model ID:</span>
                    <span className="text-amber-400">{selectedRecord.local_model_id} ({selectedRecord.current_local_model_version})</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-1.5 text-[11px] text-emerald-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Zero Raw Telemetry Outbound Policy:
                    </span>
                    <span>ENFORCED AT EDGE BOUNDARY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Register New Industrial Equipment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provision an edge digital twin, isolated local data vault, and local predictive model.
            </p>

            {formError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Machine ID</label>
                  <input
                    type="text"
                    value={formData.machine_id}
                    onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Machine Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Centrifugal Slurry Pump"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. ABB / WEG"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Model Number</label>
                  <input
                    type="text"
                    placeholder="e.g. M3BP 250"
                    value={formData.model_number}
                    onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Power (kW)</label>
                  <input
                    type="number"
                    value={formData.power_kw}
                    onChange={(e) => setFormData({ ...formData, power_kw: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Current (A)</label>
                  <input
                    type="number"
                    value={formData.current_a}
                    onChange={(e) => setFormData({ ...formData, current_a: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Rated RPM</label>
                  <input
                    type="number"
                    value={formData.speed_rpm}
                    onChange={(e) => setFormData({ ...formData, speed_rpm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Bearing Specification</label>
                  <input
                    type="text"
                    value={formData.bearing_type}
                    onChange={(e) => setFormData({ ...formData, bearing_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Insulation Class</label>
                  <input
                    type="text"
                    value={formData.insulation_class}
                    onChange={(e) => setFormData({ ...formData, insulation_class: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Confirm Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
