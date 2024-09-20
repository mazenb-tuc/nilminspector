from typing import Annotated, Dict

from pydantic import PlainValidator, WithJsonSchema, PlainSerializer

import pandas as pd
import numpy as np

PDTimestamp = Annotated[
    pd.Timestamp,
    PlainValidator(lambda x: pd.Timestamp(x)),
    WithJsonSchema({"type": "date-time"}),
]


RawDataDict = Dict[PDTimestamp, float]

# serialize to a list of floats
NPArray_1D = Annotated[
    np.ndarray,
    PlainValidator(lambda x: np.array(x)),
    PlainSerializer(lambda x: [float(i) for i in x]),
    WithJsonSchema(
        {"type": "array", "items": {"type": "number"}},
    ),
]

# serialize to a list of lists of floats
NPArray_2D = Annotated[
    np.ndarray,
    PlainValidator(lambda x: np.array(x)),
    PlainSerializer(lambda x: [[float(i) for i in row] for row in x]),
    WithJsonSchema(
        {"type": "array", "items": {"type": "array", "items": {"type": "number"}}},
    ),
]
