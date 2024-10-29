from typing import List

import numpy as np

from .. import apps
from .. import metrics
from .celery import app
from ..data import get_data
from ..types.tasks import TaskState
from ..types.err import ErrType
from ..types.tasks.err import (
    ComputeErrTaskParams,
    ComputeErrTaskResult,
    ComputeErrProgressMsg,
)


@app.task(name="compute_errors", bind=True)
def compute_errors(self, params_json: str) -> str:
    if self:
        self.update_state(
            state=TaskState.STARTED,
            meta=ComputeErrProgressMsg(percentage=0).model_dump_json(),
        )
    p: ComputeErrTaskParams = ComputeErrTaskParams.model_validate_json(params_json)

    data = get_data(p.exp_name).overlapping_data
    matched_app_name = apps.find_matching_app_name_in_data_keys(
        p.exp_name,
        p.app_name,
        data.keys(),
    )
    gt_np = np.array(list(data[matched_app_name]), dtype=np.float32)
    pr_np = np.array(list(p.full_pred.pred.values()), dtype=np.float32)

    errors: List[float] = []
    for wind_start in range(0, gt_np.size - p.seq_len):
        gt_np_wind = gt_np[wind_start : wind_start + p.seq_len]
        pr_np_wind = pr_np[wind_start : wind_start + p.seq_len]

        if p.err_type is ErrType.MAE:
            errors.append(metrics.mae(gt_np_wind, pr_np_wind))
        elif p.err_type is ErrType.F1:
            errors.append(
                metrics.f1_score(gt_np_wind, pr_np_wind, p.on_power_threshold)
            )

        if self:
            progress_percentage = int(wind_start / (gt_np.size - p.seq_len) * 100)
            if progress_percentage > 100:
                progress_percentage = 100
            self.update_state(
                state=TaskState.RUNNING,
                meta=ComputeErrProgressMsg(
                    percentage=progress_percentage
                ).model_dump_json(),
            )

    if self:
        self.update_state(
            state=TaskState.FINISHED,
            meta=ComputeErrProgressMsg(percentage=100).model_dump_json(),
        )

    return ComputeErrTaskResult(errors=errors).model_dump_json()
