"""
Local Machine-Learning Predictive Model.
Implements a multiclass regularized softmax classifier with explicit weights
and biases using pure Python linear algebra.
100% compliant with enterprise Application Control security policies.
"""
import math
import random
import time
from typing import Dict, Any, List, Tuple, Optional

CLASSES = ["Normal", "Bearing Wear", "Stator Overheating", "Mechanical Imbalance"]
FEATURE_NAMES = [
    "vibration_rms",
    "vibration_p2p",
    "temperature_c",
    "twin_temp_residual",
    "current_a",
    "load_pct",
    "speed_rpm",
    "twin_vib_residual"
]

class LocalPredictiveModel:
    def __init__(self, machine_id: str, version: str = "v1.0.0"):
        self.machine_id = machine_id
        self.version = version
        self.num_features = len(FEATURE_NAMES)
        self.num_classes = len(CLASSES)
        
        # Scaling parameters (nominal mean and std)
        self.means = [1.0, 3.2, 58.0, 0.0, 95.0, 75.0, 1485.0, 0.0]
        self.stds = [0.6, 1.8, 14.0, 8.0, 25.0, 20.0, 15.0, 0.8]
        
        # Initialize 8 x 4 weights matrix and 4 biases
        self.weights: List[List[float]] = [[0.0 for _ in range(self.num_classes)] for _ in range(self.num_features)]
        self.biases: List[float] = [0.0 for _ in range(self.num_classes)]
        self._initialize_baseline_weights()
        
        self.training_cycles = 0
        self.last_trained_timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

    def _initialize_baseline_weights(self):
        # Class 0: Normal (strong positive prior logit for baseline healthy conditions)
        self.weights[0][0] = -1.8
        self.weights[2][0] = -1.2
        self.weights[3][0] = -2.0
        self.weights[7][0] = -2.2
        self.biases[0] = 3.6
        
        # Class 1: Bearing Wear
        self.weights[0][1] = 2.5
        self.weights[1][1] = 2.2
        self.weights[7][1] = 2.8
        self.biases[1] = -2.6
        
        # Class 2: Stator Overheating
        self.weights[2][2] = 2.8
        self.weights[3][2] = 2.5
        self.weights[4][2] = 1.6
        self.biases[2] = -2.6
        
        # Class 3: Mechanical Imbalance
        self.weights[0][3] = 1.9
        self.weights[4][3] = 1.3
        self.weights[6][3] = -1.6
        self.biases[3] = -2.8

    def _extract_features(self, reading: Dict[str, Any], twin_residuals: Dict[str, float]) -> List[float]:
        raw = [
            float(reading.get("vibration_rms_mms", 1.0)),
            float(reading.get("vibration_peak_to_peak", 3.2)),
            float(reading.get("temperature_c", 60.0)),
            float(twin_residuals.get("temp_residual_c", 0.0)),
            float(reading.get("current_a", 90.0)),
            float(reading.get("load_pct", 75.0)),
            float(reading.get("speed_rpm", 1485.0)),
            float(twin_residuals.get("vib_residual_mms", 0.0))
        ]
        norm = [(raw[i] - self.means[i]) / (self.stds[i] + 1e-7) for i in range(self.num_features)]
        return norm

    def predict(self, reading: Dict[str, Any], twin_residuals: Dict[str, float]) -> Dict[str, Any]:
        x = self._extract_features(reading, twin_residuals)
        
        # Compute logits = X * W + b
        logits = [
            sum(x[i] * self.weights[i][c] for i in range(self.num_features)) + self.biases[c]
            for c in range(self.num_classes)
        ]
        
        # Numerical stable softmax
        max_l = max(logits)
        exp_logits = [math.exp(l - max_l) for l in logits]
        sum_exp = sum(exp_logits)
        probs = [e / sum_exp for e in exp_logits]
        
        normal_prob = probs[0]
        risk_score = round(max(0.0, min(1.0, 1.0 - normal_prob)), 3)
        
        modes = []
        for idx in range(1, len(CLASSES)):
            modes.append({
                "mode": CLASSES[idx],
                "probability": round(probs[idx], 3),
                "severity_score": round(probs[idx] * 100, 1)
            })
        modes.sort(key=lambda m: m["probability"], reverse=True)
        
        if risk_score < 0.20:
            category = "Low"
            priority = "Routine"
        elif risk_score < 0.50:
            category = "Moderate"
            priority = "Medium"
        elif risk_score < 0.75:
            category = "High"
            priority = "Urgent"
        else:
            category = "Critical"
            priority = "Immediate Shutdown"

        health_index = round(max(0.0, min(100.0, 100.0 * (1.0 - risk_score))), 1)
        ci_spread = round(0.05 + 0.08 * (1.0 - max(probs)), 3)
        ci_lower = max(0.0, round(risk_score - ci_spread, 3))
        ci_upper = min(1.0, round(risk_score + ci_spread, 3))
        
        indicators = []
        if float(reading.get("vibration_rms_mms", 0)) > 2.8:
            indicators.append(f"Elevated Vibration RMS ({reading.get('vibration_rms_mms')} mm/s exceeds ISO warning limit)")
        if float(twin_residuals.get("vib_residual_mms", 0)) > 1.2:
            indicators.append(f"Digital Twin Vibration Residual (+{twin_residuals.get('vib_residual_mms')} mm/s anomaly above physics baseline)")
        if float(reading.get("temperature_c", 0)) > 80.0:
            indicators.append(f"High Winding Temperature ({reading.get('temperature_c')}°C approaching thermal limit)")
        if float(twin_residuals.get("temp_residual_c", 0)) > 8.0:
            indicators.append(f"Digital Twin Thermal Anomaly (+{twin_residuals.get('temp_residual_c')}°C above nominal cooling profile)")
        if not indicators:
            indicators.append("Nominal operating parameters within configured ISO/IEC standards")

        return {
            "health_index": health_index,
            "risk_category": category,
            "numerical_risk_score": risk_score,
            "confidence_interval": [ci_lower, ci_upper],
            "observed_indicators": indicators,
            "potential_failure_modes": modes,
            "recommended_priority": priority,
            "model_version": self.version,
            "explanation": f"Model {self.version} evaluated 8-dimensional operational feature vector. Primary contributor: {modes[0]['mode']} ({int(modes[0]['probability']*100)}% relative likelihood)."
        }

    def train_local(
        self,
        local_samples: List[Tuple[Dict[str, Any], Dict[str, float], int]],
        epochs: int = 25,
        lr: float = 0.04,
        reg: float = 0.01
    ) -> Dict[str, float]:
        """
        Genuine local gradient descent training on isolated machine samples.
        """
        if not local_samples:
            return {"loss": 0.0, "accuracy": 1.0, "samples": 0}

        X = [self._extract_features(r, twin_res) for r, twin_res, _ in local_samples]
        Y = [label for _, _, label in local_samples]
        N = len(Y)
        
        loss = 0.0
        for _ in range(epochs):
            # Compute probabilities for each sample
            all_probs = []
            sample_losses = []
            for s_idx in range(N):
                x = X[s_idx]
                target = Y[s_idx]
                logits = [
                    sum(x[i] * self.weights[i][c] for i in range(self.num_features)) + self.biases[c]
                    for c in range(self.num_classes)
                ]
                max_l = max(logits)
                exp_l = [math.exp(l - max_l) for l in logits]
                sum_e = sum(exp_l)
                p = [e / sum_e for e in exp_l]
                all_probs.append(p)
                sample_losses.append(-math.log(max(1e-12, p[target])))
                
            loss = sum(sample_losses) / N + 0.5 * reg * sum(
                self.weights[i][c]**2 for i in range(self.num_features) for c in range(self.num_classes)
            )

            # Gradient step
            for c in range(self.num_classes):
                grad_b = sum((all_probs[s_idx][c] - (1.0 if Y[s_idx] == c else 0.0)) for s_idx in range(N)) / N
                self.biases[c] -= lr * grad_b
                for i in range(self.num_features):
                    grad_w = sum(
                        (all_probs[s_idx][c] - (1.0 if Y[s_idx] == c else 0.0)) * X[s_idx][i]
                        for s_idx in range(N)
                    ) / N + reg * self.weights[i][c]
                    self.weights[i][c] -= lr * grad_w

        # Final accuracy
        correct = 0
        for s_idx in range(N):
            x = X[s_idx]
            logits = [
                sum(x[i] * self.weights[i][c] for i in range(self.num_features)) + self.biases[c]
                for c in range(self.num_classes)
            ]
            pred_class = max(range(self.num_classes), key=lambda c: logits[c])
            if pred_class == Y[s_idx]:
                correct += 1

        acc = correct / N
        self.training_cycles += 1
        self.last_trained_timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

        return {
            "loss": round(loss, 4),
            "accuracy": round(acc, 4),
            "samples": N
        }

    def export_parameter_tensors(self) -> Dict[str, Any]:
        return {
            "weights": [[round(w, 5) for w in row] for row in self.weights],
            "biases": [round(b, 5) for b in self.biases],
            "version": self.version
        }

    def load_parameter_tensors(self, weights: List[List[float]], biases: List[float], new_version: str):
        self.weights = [[float(w) for w in row] for row in weights]
        self.biases = [float(b) for b in biases]
        self.version = new_version
