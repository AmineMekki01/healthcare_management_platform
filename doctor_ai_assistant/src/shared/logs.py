import os
import sys
import io
import logging
from datetime import datetime

start_time = datetime.now().strftime('%d_%m_%Y_%H_%M_%S')
logs_path = os.path.join(os.getcwd(), 'logs')
os.makedirs(logs_path, exist_ok=True)

LOG_FILE = f"{start_time}.log"
LOG_FILE_PATH = os.path.join(logs_path, LOG_FILE)

logging_str = (
    "[ %(asctime)s ] | Module: %(module)s |" 
    "Function: %(funcName)s | Line: %(lineno)d %(name)s - %(levelname)s - %(message)s"
)

stdout_stream = sys.stdout
try:
    if getattr(sys.stdout, "encoding", "").lower() != "utf-8":
        stdout_stream = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
except Exception:
    stdout_stream = sys.stdout

logging.basicConfig(
    format=logging_str,
    level=logging.INFO,
    handlers=[
        logging.FileHandler(LOG_FILE_PATH, mode='a', encoding='utf-8'),
        logging.StreamHandler(stdout_stream),
    ],
)

logger = logging.getLogger("tbibi_app")


