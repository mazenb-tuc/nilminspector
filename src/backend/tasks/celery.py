from celery.app import Celery

from ..redis import redis_url

app: Celery = Celery(
    __name__, 
    broker=redis_url, 
    backend=redis_url,
    include=[
        'backend.tasks.dummy',
        'backend.tasks.pred',
        'backend.tasks.err',
    ]
)

app.conf.update(
    result_expires=3600,  # 1 hour
)

if __name__ == "__main__":
    app.start()
