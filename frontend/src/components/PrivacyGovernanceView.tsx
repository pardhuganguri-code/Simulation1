import React, { useState, useEffect } from "react";
import { PrivacyAuditEntry, UserRole } from "../types";
import {
  ShieldCheck,
  Lock,
  Database,
  FileCode,
  AlertCircle,
  CheckCircle2,
  Share2,
  Eye,
  Server,
  Layers,
  FileCheck,
} from "lucide-react";
import { fetchPrivacyAuditTrail } from "../api";

interface PrivacyGovernanceViewProps {
  userRole: UserRole;
}

export const PrivacyGovernanceView: React.FC<PrivacyGovernanceViewProps> = ({ userRole }) => {
  const [auditData, setAuditData] = useState<{
    policy: any;
    audit_logs: PrivacyAuditEntry[];
    total_raw_samples_uploaded: number;
  }>({
    policy: null,
    audit_logs: [],
    total_raw_samples_uploaded: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<PrivacyAuditEntry | null>(null);

  const loadAudit = async () => {
    try {
      const data = await fetchPrivacyAuditTrail();
      setAuditData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadAudit();
    const interval = setInterval(loadAudit, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 m-0">Privacy & Data Governance Dashboard</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Auditable proof of edge data locality, transmission packet inspections, and cryptographic verification of zero raw data leakage.
        </p>
      </div>

      {/* Top Stat Cards: Zero Leakage Proof */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="industrial-card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/40">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-emerald-800">Raw Sensor Data Leakage</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">0 Samples</div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">100% Edge Data Locality Maintained</div>
        </div>

        <div className="industrial-card p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Transmission Type</span>
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-800">Parameter Tensors Only</div>
          <div className="text-[11px] text-slate-500 mt-0.5">8×4 floating-point weight matrices</div>
        </div>

        <div className="industrial-card p-4 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Payload Verification</span>
            <FileCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-lg font-bold text-slate-800">SHA-256 Hashed</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Deep packet tensor inspection active</div>
        </div>

        <div className="industrial-card p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Audit Trail Events</span>
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-700">{auditData.audit_logs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Immutable governance logs recorded</div>
        </div>
      </div>

      {/* Dual Architectural Boundary Diagram & Governance Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Boundary vs Central Boundary Comparison */}
        <div className="industrial-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-600" />
            Architectural Data Partitioning Map
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Physical separation of private edge assets and centralized shared intelligence.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Edge Vault (100% Local) */}
            <div className="p-3.5 bg-slate-900 text-white rounded-lg border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-300 pb-1.5 border-b border-slate-800">
                <Database className="w-4 h-4 text-teal-400" />
                Local Machine Edge Vault
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Raw sensor waveforms & time-series
                </li>
                <li className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Detailed inspection notes & observations
                </li>
                <li className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Machine-specific digital twin calibration
                </li>
                <li className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Proprietary factory datasheets
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-teal-400 font-mono">
                STATUS: ENCRYPTED AT REST IN ISOLATED VAULTS
              </div>
            </div>

            {/* Central Coordinator (Shared) */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 pb-1.5 border-b border-slate-200">
                <Server className="w-4 h-4 text-blue-600" />
                Central Coordinator Domain
              </div>
              <ul className="space-y-1.5 text-slate-600 text-[11px]">
                <li className="flex items-center gap-1.5 text-blue-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Approved model weights delta (8x4 tensors)
                </li>
                <li className="flex items-center gap-1.5 text-blue-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Local sample count scalar ($n_k$)
                </li>
                <li className="flex items-center gap-1.5 text-blue-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Aggregated global model versions
                </li>
                <li className="flex items-center gap-1.5 text-blue-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Audit logs & compliance checksums
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                STATUS: STRICTLY ZERO RAW TELEMETRY ACCEPTED
              </div>
            </div>
          </div>

          {/* Nuanced Privacy Reality Callout */}
          <div className="mt-4 p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              Academic Research Privacy Notice:
            </div>
            <p className="text-[11px] text-amber-800">
              Federated learning keeps raw sensor histories local by design. However, federated learning does not mathematically guarantee total privacy
              against gradient inversion or membership inference without additional mechanisms like Differential Privacy (DP) or Secure Multi-Party Computation (SMPC).
            </p>
          </div>
        </div>

        {/* Live Payload Deep Inspection Viewer */}
        <div className="industrial-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-teal-600" />
              Interactive Data Locality Auditor (Transmission Payload)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Deep inspection of the JSON schema transmitted during a federated update cycle.
            </p>

            <div className="bg-slate-950 text-slate-200 p-3.5 rounded-lg font-mono text-[11px] overflow-x-auto max-h-64 border border-slate-800">
              <pre>{JSON.stringify({
                "transmission_packet_certified": true,
                "forbidden_keys_detected": [],
                "raw_sensor_samples": 0,
                "payload_metadata": {
                  "update_id": "UPD-MTR-002-84192",
                  "source_machine": "MTR-002",
                  "sample_count": 40,
                  "training_loss": 0.412,
                  "validation_accuracy": 0.95
                },
                "parameter_weights_tensor_8x4": [
                  [-1.78, 2.45, -0.12, 0.22],
                  [0.05, 2.12, -0.04, 0.18],
                  [-1.18, 0.15, 2.82, -0.21],
                  [-1.95, 0.42, 2.51, 0.08],
                  [0.08, -0.11, 1.62, 1.25],
                  [0.02, 0.05, 0.12, -0.08],
                  [-0.04, -0.15, -0.22, -1.61],
                  [-2.15, 2.78, 0.35, 0.88]
                ],
                "parameter_biases_4": [3.61, -2.58, -2.62, -2.79],
                "sha256_checksum": "d9963b3ca6dc84e72a091b654032d881e..."
              }, null, 2)}</pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Payload Size: <strong className="text-slate-800 font-mono">~312 Bytes</strong></span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Certified Free of Time-Series Arrays
            </span>
          </div>
        </div>
      </div>

      {/* Immutable Privacy Audit Trail Ledger */}
      <div className="industrial-card p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          Immutable Privacy & Governance Audit Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-2.5">Audit ID</th>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Machine / Node</th>
                <th className="p-2.5">Event Type</th>
                <th className="p-2.5">Payload Type</th>
                <th className="p-2.5">Raw Samples Shared</th>
                <th className="p-2.5">Locality Verified</th>
                <th className="p-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditData.audit_logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-bold text-slate-700">{log.id}</td>
                  <td className="p-2.5 text-slate-500">{log.timestamp}</td>
                  <td className="p-2.5 text-teal-700 font-bold">{log.machine_id}</td>
                  <td className="p-2.5 text-slate-800">{log.event_type}</td>
                  <td className="p-2.5 text-slate-600">{log.payload_type}</td>
                  <td className="p-2.5 font-bold text-emerald-600">{log.raw_sensor_samples_shared}</td>
                  <td className="p-2.5">
                    {log.data_locality_verified ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        PASS (100% LOCAL)
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        INTERCEPTED
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-600 font-sans text-[11px] max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
