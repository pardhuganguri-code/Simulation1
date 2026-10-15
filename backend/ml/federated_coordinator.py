"""
Central Federated Learning Coordinator & Model Evaluation Engine.
Implements:
- Federated Averaging (FedAvg)
- Update Authorization & Validation
- Global Model Versioning (v1.0.0, v1.1.0, etc.)
- Held-out Evaluation Test Bench (Precision, Recall, F1, FPR, Confusion Matrix)
- Distribution to participating equipment
Implemented in pure Python for robust enterprise security policy compliance.
"""
import math
import random
import time
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from backend.models import ModelUpdatePayload, FederatedRound
from backend.ml.local_model import CLASSES, FEATURE_NAMES

class FederatedCoordinator:
    def __init__(self):
        self.current_global_version = "v1.0.0"
        self.aggregation_rounds: List[FederatedRound] = []
        self.update_repository: Dict[str, ModelUpdatePayload] = {}
        
        # Initialize Global Shared Model weights (8 features x 4 classes)
        self.num_features = len(FEATURE_NAMES)
        self.num_classes = len(CLASSES)
        self.global_weights = [[0.0 for _ in range(self.num_classes)] for _ in range(self.num_features)]
        self.global_biases = [0.0 for _ in range(self.num_classes)]
        self._init_global_parameters()
        
        # Generate reproducible held-out test set (320 samples across industrial motor conditions)
        self.held_out_X, self.held_out_Y = self._generate_held_out_test_set()
        
        # Baseline evaluation
        self.latest_evaluation = self.evaluate_model(self.global_weights, self.global_biases)

    def _init_global_parameters(self):
        # Initial baseline inductive weights
        self.global_weights[0][0] = -1.8
        self.global_weights[2][0] = -1.2
        self.global_weights[3][0] = -2.0
        self.global_weights[7][0] = -2.2
        self.global_biases[0] = 3.6
        
        self.global_weights[0][1] = 2.5
        self.global_weights[1][1] = 2.2
        self.global_weights[7][1] = 2.8
        self.global_biases[1] = -2.6
        
        self.global_weights[2][2] = 2.8
        self.global_weights[3][2] = 2.5
        self.global_weights[4][2] = 1.6
        self.global_biases[2] = -2.6
        
        self.global_weights[0][3] = 1.9
        self.global_weights[4][3] = 1.3
        self.global_weights[6][3] = -1.6
        self.global_biases[3] = -2.8

    def _generate_held_out_test_set(self) -> Tuple[List[List[float]], List[int]]:
        """
        Creates 320 independent held-out industrial test cycles with realistic
        multivariate distributions for honest validation.
        """
        rng = random.Random(999)
        means = [1.0, 3.2, 58.0, 0.0, 95.0, 75.0, 1485.0, 0.0]
        stds = [0.5, 1.5, 12.0, 3.0, 25.0, 20.0, 15.0, 0.3]
        
        X_raw = []
        Y = []
        
        # 160 Normal samples (Class 0)
        for _ in range(160):
            vib_rms = rng.gauss(0.9, 0.15)
            vib_p2p = vib_rms * rng.gauss(3.2, 0.2)
            temp = rng.gauss(58.0, 4.0)
            twin_t_res = rng.gauss(0.5, 0.8)
            curr = rng.gauss(92.0, 6.0)
            load = rng.gauss(72.0, 8.0)
            speed = 1500 - (load * 0.15) + rng.gauss(0, 1.5)
            twin_v_res = rng.gauss(0.05, 0.1)
            X_raw.append([vib_rms, vib_p2p, temp, twin_t_res, curr, load, speed, twin_v_res])
            Y.append(0)
            
        # 60 Bearing Wear samples (Class 1)
        for _ in range(60):
            vib_rms = rng.gauss(3.8, 0.6)
            vib_p2p = vib_rms * rng.gauss(4.8, 0.5)
            temp = rng.gauss(68.0, 5.0)
            twin_t_res = rng.gauss(4.5, 1.5)
            curr = rng.gauss(98.0, 8.0)
            load = rng.gauss(75.0, 9.0)
            speed = 1500 - (load * 0.16) + rng.gauss(0, 2.0)
            twin_v_res = rng.gauss(2.6, 0.5)
            X_raw.append([vib_rms, vib_p2p, temp, twin_t_res, curr, load, speed, twin_v_res])
            Y.append(1)
            
        # 50 Stator Overheating samples (Class 2)
        for _ in range(50):
            vib_rms = rng.gauss(1.4, 0.3)
            vib_p2p = vib_rms * rng.gauss(3.4, 0.3)
            temp = rng.gauss(88.0, 6.0)
            twin_t_res = rng.gauss(18.0, 3.5)
            curr = rng.gauss(138.0, 8.0)
            load = rng.gauss(92.0, 6.0)
            speed = 1500 - (load * 0.22) + rng.gauss(0, 2.0)
            twin_v_res = rng.gauss(0.4, 0.2)
            X_raw.append([vib_rms, vib_p2p, temp, twin_t_res, curr, load, speed, twin_v_res])
            Y.append(2)
            
        # 50 Mechanical Imbalance samples (Class 3)
        for _ in range(50):
            vib_rms = rng.gauss(3.4, 0.5)
            vib_p2p = vib_rms * rng.gauss(3.6, 0.3)
            temp = rng.gauss(64.0, 4.0)
            twin_t_res = rng.gauss(2.0, 1.0)
            curr = rng.gauss(108.0, 7.0)
            load = rng.gauss(80.0, 7.0)
            speed = 1500 - (load * 0.18) + rng.gauss(0, 3.0)
            twin_v_res = rng.gauss(2.1, 0.4)
            X_raw.append([vib_rms, vib_p2p, temp, twin_t_res, curr, load, speed, twin_v_res])
            Y.append(3)

        # Normalize features
        X_norm = [
            [(row[i] - means[i]) / (stds[i] + 1e-7) for i in range(len(means))]
            for row in X_raw
        ]
        return X_norm, Y

    def evaluate_model(self, weights: List[List[float]], biases: List[float]) -> Dict[str, Any]:
        """Runs multi-class and binary metrics on held-out test bench."""
        total = len(self.held_out_Y)
        preds = []
        losses = []
        
        cm = [[0 for _ in range(self.num_classes)] for _ in range(self.num_classes)]
        
        for idx in range(total):
            x = self.held_out_X[idx]
            target = self.held_out_Y[idx]
            
            logits = [
                sum(x[i] * weights[i][c] for i in range(self.num_features)) + biases[c]
                for c in range(self.num_classes)
            ]
            max_l = max(logits)
            exp_l = [math.exp(l - max_l) for l in logits]
            sum_e = sum(exp_l)
            probs = [e / sum_e for e in exp_l]
            
            pred_class = max(range(self.num_classes), key=lambda c: logits[c])
            preds.append(pred_class)
            cm[target][pred_class] += 1
            losses.append(-math.log(max(1e-12, probs[target])))

        accuracy = sum(1 for p, y in zip(preds, self.held_out_Y) if p == y) / total
        avg_loss = sum(losses) / total
        
        # Binary fault detection metrics (Normal vs Any Failure)
        # Class 0: Negative, Class 1,2,3: Positive
        tp = sum(1 for p, y in zip(preds, self.held_out_Y) if y > 0 and p > 0)
        fp = sum(1 for p, y in zip(preds, self.held_out_Y) if y == 0 and p > 0)
        tn = sum(1 for p, y in zip(preds, self.held_out_Y) if y == 0 and p == 0)
        fn = sum(1 for p, y in zip(preds, self.held_out_Y) if y > 0 and p == 0)

        precision = round(tp / (tp + fp) if (tp + fp) > 0 else 0.0, 4)
        recall = round(tp / (tp + fn) if (tp + fn) > 0 else 0.0, 4)
        f1_score = round(2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0, 4)
        fpr = round(fp / (fp + tn) if (fp + tn) > 0 else 0.0, 4)

        return {
            "accuracy": round(accuracy, 4),
            "loss": round(avg_loss, 4),
            "precision": precision,
            "recall": recall,
            "f1_score": f1_score,
            "false_positive_rate": fpr,
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
            "confusion_matrix": cm,
            "classes": CLASSES,
            "test_samples_count": total,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

    def register_update(self, payload: ModelUpdatePayload):
        self.update_repository[payload.update_id] = payload

    def authorize_update(self, update_id: str, admin_user: str, approved: bool, reason: str = "") -> Optional[ModelUpdatePayload]:
        if update_id not in self.update_repository:
            return None
        payload = self.update_repository[update_id]
        if approved:
            payload.status = "Approved"
            payload.authorization_decision_by = admin_user
            payload.authorization_timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        else:
            payload.status = "Rejected"
            payload.authorization_decision_by = admin_user
            payload.authorization_timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
            payload.rejection_reason = reason
        return payload

    def aggregate_approved_updates(self) -> Dict[str, Any]:
        """
        Executes genuine Federated Averaging (FedAvg):
        W_global = sum(n_k / N_total * W_k)
        b_global = sum(n_k / N_total * b_k)
        """
        eligible_updates = [
            up for up in self.update_repository.values()
            if up.status == "Approved"
        ]
        
        if not eligible_updates:
            return {
                "success": False,
                "message": "No approved model updates available for aggregation."
            }

        total_samples = sum(up.sample_count for up in eligible_updates)
        if total_samples == 0:
            total_samples = len(eligible_updates)

        # Baseline evaluation before aggregation
        pre_metrics = self.evaluate_model(self.global_weights, self.global_biases)

        # FedAvg weighted tensor sum
        new_weights = [[0.0 for _ in range(self.num_classes)] for _ in range(self.num_features)]
        new_biases = [0.0 for _ in range(self.num_classes)]
        participating_machines = []

        for up in eligible_updates:
            weight_k = float(up.sample_count) / float(total_samples)
            for i in range(self.num_features):
                for c in range(self.num_classes):
                    new_weights[i][c] += weight_k * up.parameter_weights[i][c]
            for c in range(self.num_classes):
                new_biases[c] += weight_k * up.parameter_biases[c]
                
            participating_machines.append(up.machine_id)
            up.status = "Aggregated"

        self.global_weights = new_weights
        self.global_biases = new_biases

        # Version bump: v1.0.0 -> v1.1.0 etc.
        major, minor, patch = self.current_global_version.replace("v", "").split(".")
        new_version = f"v{major}.{int(minor)+1}.0"
        old_version = self.current_global_version
        self.current_global_version = new_version

        # Evaluation post aggregation on identical held-out test bench
        post_metrics = self.evaluate_model(self.global_weights, self.global_biases)
        self.latest_evaluation = post_metrics
        
        improvement_delta = round((post_metrics["f1_score"] - pre_metrics["f1_score"]) * 100, 2)

        fed_round = FederatedRound(
            round_number=len(self.aggregation_rounds) + 1,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            base_model_version=old_version,
            new_model_version=new_version,
            participating_machines=list(set(participating_machines)),
            total_samples=total_samples,
            pre_aggregation_accuracy=pre_metrics["accuracy"],
            post_aggregation_accuracy=post_metrics["accuracy"],
            pre_aggregation_loss=pre_metrics["loss"],
            post_aggregation_loss=post_metrics["loss"],
            improvement_delta_pct=improvement_delta,
            distribution_status="Pending"
        )
        self.aggregation_rounds.append(fed_round)

        return {
            "success": True,
            "round": fed_round.model_dump(),
            "pre_metrics": pre_metrics,
            "post_metrics": post_metrics,
            "new_version": new_version
        }

    def mark_distributed(self, round_number: int):
        for r in self.aggregation_rounds:
            if r.round_number == round_number:
                r.distribution_status = "Distributed"
