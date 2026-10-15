import React, { useState, useEffect } from "react";
import { ModelUpdatePayload, FederatedRound, UserRole } from "../types";
import {
  Share2,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  TrendingUp,
  Cpu,
  RefreshCw,
  Send,
  Lock,
} from "lucide-react";
import {
  fetchCoordinatorUpdates,
  authorizeModelUpdate,
  executeFederatedAggregation,
  distributeSharedModel,
  fetchModelEvaluation,
} from "../api";

interface FederatedLearningViewProps {
  userRole: UserRole;
  onRefreshFleet: () => void;
}

export const FederatedLearningView: React.FC<FederatedLearningViewProps> = ({
  userRole,
  onRefreshFleet,
}) => {
  const [updates, setUpdates] = useState<ModelUpdatePayload[]>([]);
  const [evalData, setEvalData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAggregating, setIsAggregating] = useState<boolean>(false);
  const [isDistributing, setIsDistributing] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [upList, evalRes] = await Promise.all([
        fetchCoordinatorUpdates(),
        fetchModelEvaluation(),
      ]);
      setUpdates(upList);
      setEvalData(evalRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAuthorize = async (updateId: string, approved: boolean) => {
    try {
      await authorizeModelUpdate(
        updateId,
        approved,
        `Admin: ${userRole}`,
        approved ? "Payload verified: compliant parameter weights only" : "Rejected by policy"
      );
      setActionFeedback(`Update ${updateId} marked as ${approved ? "APPROVED" : "REJECTED"}.`);
      await loadData();
      onRefreshFleet();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const handleAggregate = async () => {
    setIsAggregating(true);
    try {
      const res = await executeFederatedAggregation();
      setActionFeedback(
        `FedAvg Round #${res.round.round_number} succeeded! Model bumped to ${res.new_version} (${res.round.participating_machines.join(", ")}).`
      );
      await loadData();
      onRefreshFleet();
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionFeedback(`Aggregation failed: ${err.message}`);
    } finally {
      setIsAggregating(false);
    }
  };

  const handleDistribute = async () => {
    setIsDistributing(true);
    try {
      const res = await distributeSharedModel();
      setActionFeedback(
        `Shared Model ${res.new_version} distributed to ${res.synchronized_machines.length} edge machines! Local digital twins and private data remained strictly isolated.`
      );
      await loadData();
      onRefreshFleet();
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionFeedback(`Distribution failed: ${err.message}`);
    } finally {
      setIsDistributing(false);
    }
  };

  const pendingAuthUpdates = updates.filter((u) => u.status === "Awaiting Authorization");
  const approvedUpdates = updates.filter((u) => u.status === "Approved");
  const aggregatedUpdates = updates.filter((u) => u.status === "Aggregated");
  const rejectedUpdates = updates.filter((u) => u.status === "Rejected");

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Central Federated Learning Coordinator</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collects authorized parameter weight updates, runs Federated Averaging (FedAvg), validates generalization, and distributes shared models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Current Shared Model:</span>
          <span className="bg-slate-900 text-cyan-400 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-700">
            {evalData?.global_model_version || "v1.0.0"}
          </span>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-teal-50 border border-teal-300 text-teal-800 text-xs rounded-lg flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="font-bold text-teal-600">×</button>
        </div>
      )}

      {/* Top Aggregation & Distribution Action Station */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Authorization Queue Summary */}
        <div className="industrial-card p-4 border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
              <span>Step 1: Authorization Queue</span>
              <span className="bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
                {pendingAuthUpdates.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Administrator review of local parameter payloads before allowing inclusion into the federated aggregation pool.
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            Approved in queue: <strong className="text-teal-700">{approvedUpdates.length}</strong>
          </div>
        </div>

        {/* Step 2: FedAvg Trigger Station */}
        <div className="industrial-card p-4 border-l-4 border-l-teal-500 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
              <span>Step 2: Federated Aggregation</span>
              <span className="bg-teal-100 text-teal-800 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
                FedAvg Engine
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Computes sample-weighted coordinate-wise average of approved weight tensors:
              <span className="block font-mono text-[10px] text-teal-700 mt-1 bg-slate-50 p-1 rounded">
                W_global = Σ (n_k / N) * W_k
              </span>
            </p>
          </div>

          <div className="mt-3">
            <button
              onClick={handleAggregate}
              disabled={isAggregating || approvedUpdates.length === 0}
              className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isAggregating ? "animate-spin" : ""}`} />
              {isAggregating ? "Executing FedAvg..." : `Run FedAvg (${approvedUpdates.length} Approved)`}
            </button>
          </div>
        </div>

        {/* Step 3: Distribution Station */}
        <div className="industrial-card p-4 border-l-4 border-l-cyan-500 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
              <span>Step 3: Fleet Distribution</span>
              <span className="bg-cyan-100 text-cyan-800 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
                Star Topology
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Synchronize the new shared model parameters to all edge machines while preserving each machine's private digital twin.
            </p>
          </div>

          <div className="mt-3">
            <button
              onClick={handleDistribute}
              disabled={isDistributing}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isDistributing ? "animate-spin" : ""}`} />
              {isDistributing ? "Distributing..." : "Distribute Model to Fleet"}
            </button>
          </div>
        </div>
      </div>

      {/* Update Authorization Queue Table */}
      <div className="industrial-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Local Model Update Authorization Queue</h3>
            <p className="text-xs text-slate-500">Only verified parameter updates with cryptographic proofs can be merged.</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total Submitted: {updates.length}</span>
        </div>

        {updates.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No local model updates have been prepared yet. Go to <span className="font-semibold text-teal-600">Maintenance Workflow</span> to train and prepare an update.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-2.5">Update ID</th>
                  <th className="p-2.5">Source Machine</th>
                  <th className="p-2.5">Local Samples</th>
                  <th className="p-2.5">Loss / Acc</th>
                  <th className="p-2.5">SHA-256 Checksum</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Admin Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {updates.map((up) => (
                  <tr key={up.update_id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-mono font-bold text-slate-800">{up.update_id}</td>
                    <td className="p-2.5 font-mono font-medium text-teal-700">{up.machine_id}</td>
                    <td className="p-2.5 font-mono text-slate-700">{up.sample_count} cycles</td>
                    <td className="p-2.5 font-mono text-slate-700">
                      loss: {up.training_loss.toFixed(3)} | acc: {(up.validation_accuracy * 100).toFixed(0)}%
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-500 truncate max-w-[120px]" title={up.privacy_checksum}>
                      {up.privacy_checksum.slice(0, 14)}...
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          up.status === "Approved"
                            ? "bg-teal-100 text-teal-800"
                            : up.status === "Aggregated"
                            ? "bg-cyan-100 text-cyan-800"
                            : up.status === "Rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {up.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {up.status === "Awaiting Authorization" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAuthorize(up.update_id, true)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleAuthorize(up.update_id, false)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded flex items-center gap-1 shadow-2xs"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {up.authorization_decision_by ? `Authorized by ${up.authorization_decision_by}` : "Processed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Aggregation Rounds History */}
      <div className="industrial-card p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-teal-600" />
          Central Federated Aggregation Event Ledger
        </h3>

        {(!evalData?.aggregation_history || evalData.aggregation_history.length === 0) ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No aggregation rounds completed yet. Approve an update and execute FedAvg above.
          </div>
        ) : (
          <div className="space-y-3">
            {evalData.aggregation_history.map((round: FederatedRound) => (
              <div key={round.round_number} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-700">Round #{round.round_number}</span>
                    <span className="bg-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded text-[10px]">
                      {round.base_model_version} → {round.new_model_version}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {round.distribution_status}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{round.timestamp}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Participating Nodes:</span>
                    <span className="font-bold text-slate-800">{round.participating_machines.join(", ")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Training Samples:</span>
                    <span className="font-mono font-bold text-slate-800">{round.total_samples} samples</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Accuracy (Pre → Post):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {(round.pre_aggregation_accuracy * 100).toFixed(1)}% → {(round.post_aggregation_accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Held-out Loss (Pre → Post):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {round.pre_aggregation_loss.toFixed(3)} → {round.post_aggregation_loss.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
