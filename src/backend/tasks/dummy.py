# see nbs/other/27

import time

from pydantic import BaseModel

from .celery import app


class DummyIn(BaseModel):
    s: str
    i: int
    f: float


@app.task(name="dummy")
def dummy(params_dict: dict) -> tuple:
    params: DummyIn = DummyIn.model_validate(params_dict)
    time.sleep(params.i)
    return params.model_dump(), params.model_dump_json()


@app.task(name="dummy_with_prog", bind=True)
def dummy_with_prog(self, params_dict: dict) -> tuple:
    if self:
        self.update_state(state="STARTED", meta={"step": 0})
    n_steps = 4
    params: DummyIn = DummyIn.model_validate(params_dict)
    for i in range(n_steps):
        time.sleep(params.i / n_steps)
        if self:
            self.update_state(state="PROGRESS", meta={"step": i + 1})
    return params.model_dump(), params.model_dump_json()
