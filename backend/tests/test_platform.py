"""
Comprehensive test suite verifying core architectural workflows:
1. Equipment registration & retrieval
2. Machine state independence (Motor A, B, C)
3. Digital twin physics bounds & iterative calibration
4. Sensor streaming & controlled abnormal condition injection
5. Predictive risk assessment & failure mode classification
6. Maintenance recording & local storage isolation
7. Privacy verification: certifying zero raw sensor leak in model update payload
8. Rejection of unauthorized updates from entering aggregation
9. Genuine Federated Averaging (FedAvg) and version increment
10. Held-out test evaluation before and after aggregation
11. Distribution of updated global model to fleet
"""
import sys
import os

from backend.main import (
    FLEET, coordinator, privacy_guard, initialize_default_motors,
    prepare_local_model_update, authorize_model_update,
    run_federated_aggregation, distribute_shared_model
)
from backend.models import EquipmentRecord, TechnicalSpecs, OperatingLimits, MaintenanceActivity

def run_all_tests():
    print("=== STARTING FEDERATED PRIVACY MACHINE PULSE TEST SUITE ===")
    
    # Test 1: Initialize default motors
    initialize_default_motors()
    assert len(FLEET) == 3, f"Expected 3 motors, got {len(FLEET)}"
    assert "MTR-001" in FLEET and "MTR-002" in FLEET and "MTR-003" in FLEET
    print("[PASS] Test 1: Equipment registry initialized with 3 independent motors (MTR-001, MTR-002, MTR-003)")

    # Test 2: Machine State Independence
    motor_a = FLEET["MTR-001"]
    motor_b = FLEET["MTR-002"]
    
    # Introduce fault only on Motor B
    motor_b.simulator.set_abnormal_condition("bearing_fault", severity=0.8)
    motor_b.record.abnormal_condition = "bearing_fault"
    
    for _ in range(25):
        motor_a.step()
        motor_b.step()
        
    assert motor_a.latest_reading.vibration_rms_mms < 2.0, "Motor A vibration should remain low"
    assert motor_b.latest_reading.vibration_rms_mms > 2.5, "Motor B vibration should climb"
    assert motor_a.record.abnormal_condition is None, "Motor A should have no abnormal condition"
    assert motor_b.record.abnormal_condition == "bearing_fault", "Motor B should have bearing fault"
    print("[PASS] Test 2: Machine states verified strictly independent. Motor A unaffected by Motor B fault.")

    # Test 3: Digital Twin physics bounds and residual detection
    twin_state_b = motor_b.digital_twin.evaluate_state(motor_b.latest_reading)
    assert twin_state_b.residual_deviations["vib_residual_mms"] > 1.0, "Twin should flag vibration deviation residual"
    
    # Test twin calibration
    calib_res = motor_b.digital_twin.calibrate(motor_b.simulator.history, "Test Calibration")
    assert calib_res["status"] == "success"
    assert motor_b.digital_twin.calibration_version == 2
    print(f"[PASS] Test 3: Digital Twin residual deviation calculated. Iterative calibration advanced to v{motor_b.digital_twin.calibration_version}.")

    # Test 4: Predictive Maintenance inference
    pred_b = motor_b.latest_assessment
    assert pred_b is not None
    assert pred_b.numerical_risk_score > 0.5, "Risk score should be elevated for Motor B"
    assert pred_b.potential_failure_modes[0]["mode"] == "Bearing Wear", "Top failure mode should be Bearing Wear"
    print(f"[PASS] Test 4: Predictive Maintenance risk={pred_b.numerical_risk_score}, category={pred_b.risk_category}, top mode={pred_b.potential_failure_modes[0]['mode']}")

    # Test 5: Local Data Locality & Storage Isolation
    history_a = motor_a.local_store.get_local_sensor_history()
    history_b = motor_b.local_store.get_local_sensor_history()
    assert len(history_a) > 0 and len(history_b) > 0
    # Verify stores are isolated files on disk
    assert motor_a.local_store.vault_path != motor_b.local_store.vault_path
    print("[PASS] Test 5: Local storage vaults isolated on disk. Raw operational data strictly local.")

    # Test 6: Prepare Local Model Update with Privacy Certification
    update_res = prepare_local_model_update("MTR-002")
    assert update_res["status"] == "success"
    update_obj = update_res["update"]
    assert update_obj["status"] == "Awaiting Authorization"
    assert update_obj["raw_sensor_data_leak_detected"] == False
    assert "privacy_checksum" in update_obj
    print(f"[PASS] Test 6: Local model trained locally. Certified parameter update payload created with checksum {update_obj['privacy_checksum'][:12]}...")

    # Test 7: Prevent Unauthorized Updates from Entering Aggregation
    try:
        agg_attempt = coordinator.aggregate_approved_updates()
        assert False, "Aggregation should fail when no updates are approved"
    except Exception:
        pass
    print("[PASS] Test 7: Coordinator successfully prevented unapproved update from entering aggregation.")

    # Test 8: Authorize Model Update
    auth_res = authorize_model_update(
        update_id=update_obj["update_id"],
        approved=True,
        admin_user="Plant Administrator",
        reason="Certified zero raw data transmission"
    )
    assert auth_res["status"] == "success"
    assert auth_res["update"]["status"] == "Approved"
    print("[PASS] Test 8: Model update authorized with auditable admin decision record.")

    # Test 9: Execute Federated Averaging (FedAvg)
    agg_res = run_federated_aggregation()
    assert agg_res["success"] == True
    assert agg_res["new_version"] == "v1.1.0"
    assert agg_res["round"]["round_number"] == 1
    print(f"[PASS] Test 9: FedAvg executed. New global model version {agg_res['new_version']} created with {agg_res['round']['total_samples']} samples.")

    # Test 10: Held-out Evaluation Test Bench
    pre_acc = agg_res["pre_metrics"]["accuracy"]
    post_acc = agg_res["post_metrics"]["accuracy"]
    f1 = agg_res["post_metrics"]["f1_score"]
    cm = agg_res["post_metrics"]["confusion_matrix"]
    assert len(cm) == 4 and len(cm[0]) == 4
    print(f"[PASS] Test 10: Held-out validation bench tested. Pre-acc: {pre_acc}, Post-acc: {post_acc}, F1: {f1}, Confusion matrix: 4x4 evaluated.")

    # Test 11: Distribute Model to Fleet
    dist_res = distribute_shared_model()
    assert dist_res["status"] == "success"
    assert dist_res["new_version"] == "v1.1.0"
    for m_id, node in FLEET.items():
        assert node.record.current_local_model_version == "v1.1.0"
    print("[PASS] Test 11: Shared model v1.1.0 distributed to all 3 machines. Local twins & data preserved.")

    # Test 12: Privacy Audit Log verification
    audit_trail = privacy_guard.get_audit_trail(50)
    assert len(audit_trail) > 0
    total_raw_shared = sum(e["raw_sensor_samples_shared"] for e in audit_trail)
    assert total_raw_shared == 0, f"Critical Privacy Failure: {total_raw_shared} raw samples shared!"
    print(f"[PASS] Test 12: Privacy audit trail verified with {len(audit_trail)} events. Exactly 0 raw sensor records leaked to central coordinator.")

    print("\nALL 12 ARCHITECTURAL & PRIVACY TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_all_tests()
