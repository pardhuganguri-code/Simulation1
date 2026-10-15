import React, { useState, useEffect } from "react";
import { MaintenanceActivity, UserRole } from "../types";
import {
  Wrench,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Database,
  Share2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  fetchMaintenanceRecords,
  createMaintenanceActivity,
  updateMaintenanceActivity,
  prepareLocalModelUpdate,
} from "../api";

interface MaintenanceManagementViewProps {
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  machineIds: string[];
  userRole: UserRole;
  onNavigateToFederated: () => void;
}

export const MaintenanceManagementView: React.FC<MaintenanceManagementViewProps> = ({
  selectedMachineId,
  onSelectMachine,
  machineIds,
  userRole,
  onNavigateToFederated,
}) => {
  const [records, setRecords] = useState<MaintenanceActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPreparingUpdate, setIsPreparingUpdate] = useState<boolean>(false);
  const [updateReceipt, setUpdateReceipt] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Maintenance Form State
  const [formData, setFormData] = useState({
    activity_type: "Corrective" as "Routine" | "Corrective" | "Predictive Inspection",
    status: "Completed" as "Scheduled" | "In Progress" | "Completed",
    technician_name: "R. Vance (Vibration Analyst L2)",
    observations: "Vibration spectrum exhibited BPFO bearing defect harmonics (108 Hz). Outer raceway thermal rise to 72°C.",
    confirmed_findings: "Confirmed micro-spalling on drive-end cylindrical roller bearing raceway. Lubrication was depleted.",
    actions_taken: "Replaced defective bearing with SKF NU 314 ECP. Replenished synthetic grease and checked alignment.",
    parts_replaced: "Cylindrical Roller Bearing NU 314, Oil Seal",
    operating_hours: 12450.0,
    local_update_eligible: true,
  });

  const loadRecords = async () => {
    try {
      const data = await fetchMaintenanceRecords(selectedMachineId);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadRecords();
  }, [selectedMachineId]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newRecord: MaintenanceActivity = {
        id: `MAINT-${Date.now().toString().slice(-6)}`,
        machine_id: selectedMachineId,
        activity_type: formData.activity_type,
        status: formData.status,
        created_at: new Date().toISOString().replace("T", " ").slice(0, 19),
        completed_at: formData.status === "Completed" ? new Date().toISOString().replace("T", " ").slice(0, 19) : null,
        technician_name: formData.technician_name,
        observations: formData.observations,
        confirmed_findings: formData.confirmed_findings,
        actions_taken: formData.actions_taken,
        operating_hours_at_service: formData.operating_hours,
        parts_replaced: formData.parts_replaced.split(",").map((s) => s.trim()).filter(Boolean),
        local_update_eligible: formData.local_update_eligible,
      };

      await createMaintenanceActivity(selectedMachineId, newRecord);
      setShowLogModal(false);
      setFeedback(`Maintenance record logged into ${selectedMachineId}'s local vault.`);
      await loadRecords();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrepareModelUpdate = async () => {
    setIsPreparingUpdate(true);
    setUpdateReceipt(null);
    try {
      const res = await prepareLocalModelUpdate(selectedMachineId);
      setUpdateReceipt(res);
      setFeedback(`Local model updated and certified for ${selectedMachineId}! Update awaiting Admin authorization.`);
      await loadRecords();
    } catch (err: any) {
      setFeedback(`Update preparation error: ${err.message}`);
    } finally {
      setIsPreparingUpdate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header & Machine Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Maintenance Management & Update Workflow</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log routine & corrective maintenance records into machine local storage. Prepare authorized federated updates without raw data upload.
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

      {feedback && (
        <div className="p-3 bg-teal-50 border border-teal-300 text-teal-800 text-xs rounded-lg flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold text-teal-600">×</button>
        </div>
      )}

      {/* Top Action & Privacy Guarantee Banner */}
      <div className="industrial-card p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-700">
              LOCAL ISOLATED STORE: {selectedMachineId}
            </span>
            <span className="text-xs text-slate-400">Total Activities: {records.length}</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Maintenance observations and failure findings remain strictly local. Only approved model parameter tensors are shared with the coordinator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogModal(true)}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Log Maintenance Activity
          </button>

          <button
            onClick={handlePrepareModelUpdate}
            disabled={isPreparingUpdate}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
            title="Train local model on recent verified data and prepare update"
          >
            <Share2 className={`w-4 h-4 ${isPreparingUpdate ? "animate-spin" : ""}`} />
            {isPreparingUpdate ? "Training & Certifying..." : "Prepare Local Model Update"}
          </button>
        </div>
      </div>

      {/* Certified Update Receipt (if just prepared) */}
      {updateReceipt && (
        <div className="industrial-card p-4 bg-emerald-50/80 border-emerald-300 text-xs">
          <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-200 pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Certified Model Update Prepared Locally (0 Raw Data Transmitted)
            </span>
            <span className="font-mono text-emerald-700">{updateReceipt.update.update_id}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-emerald-800">
            <div>
              <span className="text-emerald-600 block">Training Samples:</span>
              <span className="font-mono font-bold">{updateReceipt.update.sample_count} Local Cycles</span>
            </div>
            <div>
              <span className="text-emerald-600 block">Training Loss:</span>
              <span className="font-mono font-bold">{updateReceipt.update.training_loss.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-emerald-600 block">Payload Transmitted:</span>
              <span className="font-mono font-bold">{updateReceipt.certification.payload_size_bytes} Bytes (Parameters Only)</span>
            </div>
            <div>
              <span className="text-emerald-600 block">SHA-256 Checksum:</span>
              <span className="font-mono text-[11px] font-bold truncate block">
                {updateReceipt.certification.checksum.slice(0, 16)}...
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-emerald-200 flex justify-between items-center text-emerald-900">
            <span>Status: <strong className="text-amber-700 uppercase">Awaiting System Admin Authorization</strong></span>
            <button
              onClick={onNavigateToFederated}
              className="text-indigo-700 hover:text-indigo-900 font-bold underline flex items-center gap-1"
            >
              Go to Coordinator Queue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Maintenance Activities History Table */}
      <div className="industrial-card p-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-500" />
          Maintenance Activities Log ({selectedMachineId})
        </h3>

        {records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No maintenance records currently logged for this machine.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec) => (
              <div key={rec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{rec.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        rec.activity_type === "Corrective"
                          ? "bg-rose-100 text-rose-800"
                          : rec.activity_type === "Predictive Inspection"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {rec.activity_type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        rec.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>

                  <div className="text-slate-400 font-mono text-[11px]">
                    Created: {rec.created_at} {rec.completed_at && `• Completed: ${rec.completed_at}`}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Technician:</span>
                    <span className="font-medium text-slate-800">{rec.technician_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Service Operating Hours:</span>
                    <span className="font-mono font-bold text-slate-800">{rec.operating_hours_at_service} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Parts Replaced:</span>
                    <span className="text-slate-700">{rec.parts_replaced.join(", ") || "None"}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-slate-400 block font-medium">Observations:</span>
                  <p className="text-slate-700 mt-0.5">{rec.observations}</p>
                </div>

                {rec.confirmed_findings && (
                  <div className="pt-1 bg-amber-50/60 p-2 rounded border border-amber-200">
                    <span className="text-amber-800 font-bold block">Physical Confirmed Findings:</span>
                    <p className="text-amber-900 mt-0.5">{rec.confirmed_findings}</p>
                  </div>
                )}

                {rec.actions_taken && (
                  <div className="pt-1">
                    <span className="text-slate-400 block font-medium">Corrective Actions:</span>
                    <p className="text-slate-700 mt-0.5">{rec.actions_taken}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Maintenance Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Log Maintenance Activity</h3>
            <p className="text-xs text-slate-500 mb-4">
              Stored directly in <span className="font-mono font-bold text-teal-700">{selectedMachineId}</span>'s isolated edge data store.
            </p>

            <form onSubmit={handleCreateRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Activity Type</label>
                  <select
                    value={formData.activity_type}
                    onChange={(e: any) => setFormData({ ...formData, activity_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                  >
                    <option value="Routine">Routine Maintenance</option>
                    <option value="Corrective">Corrective Maintenance</option>
                    <option value="Predictive Inspection">Predictive Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Technician Name & Credentials</label>
                <input
                  type="text"
                  value={formData.technician_name}
                  onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Observations & Measurements</label>
                <textarea
                  rows={2}
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Confirmed Physical Findings</label>
                <textarea
                  rows={2}
                  value={formData.confirmed_findings}
                  onChange={(e) => setFormData({ ...formData, confirmed_findings: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Actions Taken & Parts Replaced</label>
                <textarea
                  rows={2}
                  value={formData.actions_taken}
                  onChange={(e) => setFormData({ ...formData, actions_taken: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="eligibleCheck"
                  checked={formData.local_update_eligible}
                  onChange={(e) => setFormData({ ...formData, local_update_eligible: e.target.checked })}
                  className="accent-teal-600 rounded"
                />
                <label htmlFor="eligibleCheck" className="text-slate-700 font-medium">
                  Eligible to prepare local federated model update
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save to Machine Local Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
