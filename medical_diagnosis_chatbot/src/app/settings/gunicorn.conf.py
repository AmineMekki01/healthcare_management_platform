from pydantic import Field
from pydantic_settings import BaseSettings

from src.app.core.constants import DEFAULT_NUMBER_OF_WORKERS_ON_LOCAL
from src.app.settings import settings

THREADS_PER_CORE = 1


def calculate_workers():
    print(settings.is_local)
    if settings.is_local:
        return DEFAULT_NUMBER_OF_WORKERS_ON_LOCAL

    import multiprocessing

    return multiprocessing.cpu_count() * THREADS_PER_CORE + 1


class GunicornSettings(BaseSettings):
    TIMEOUT: int = Field(env="TIMEOUT", default=120)
    WORKERS: int = Field(env="NUMBER_OF_WORKER_LOCALS",
                         default_factory=calculate_workers)
    RELOAD: bool = Field(env="RELOAD", default=settings.is_local)

    class Config:
        env_file = ".env.gunicorn"


gunicorn_settings = GunicornSettings()
bind = "0.0.0.0:8000"
workers = gunicorn_settings.WORKERS
worker_class = "uvicorn.workers.UvicornWorker"
timeout = gunicorn_settings.TIMEOUT
reload = gunicorn_settings.RELOAD
