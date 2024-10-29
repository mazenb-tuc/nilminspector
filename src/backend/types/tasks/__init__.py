from enum import Enum

# for celery task
CeleryTaskId = str

class TaskState(str, Enum):
    PENDING = "PENDING"
    STARTED = "STARTED"
    RUNNING = "RUNNING"
    FINISHED = "FINISHED"
    FAILED = "FAILED"
    SUCCESS = "SUCCESS"
