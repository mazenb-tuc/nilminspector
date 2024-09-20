import numpy as np


def mae(gt: np.ndarray, pr: np.ndarray) -> float:
    return float(np.mean(np.abs(gt - pr)))


def f1_score(
    gt: np.ndarray,
    pr: np.ndarray,
    on_power_threshold: float,
) -> float:
    gt_np_on = gt > on_power_threshold
    pr_np_on = pr > on_power_threshold

    TP = np.sum((gt_np_on == 1) & (pr_np_on == 1))
    FP = np.sum((gt_np_on == 0) & (pr_np_on == 1))
    FN = np.sum((gt_np_on == 1) & (pr_np_on == 0))
    precision = TP / (TP + FP) if (TP + FP) > 0 else 0
    recall = TP / (TP + FN) if (TP + FN) > 0 else 0
    f1_score = (
        0
        if precision + recall == 0
        else 2 * (precision * recall) / (precision + recall)
    )
    return f1_score
