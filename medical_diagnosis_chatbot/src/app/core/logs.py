"""
This module is responsible for setting up the logging configuration for the application.
"""
import logging

logging.basicConfig(level = logging.INFO)

logger = logging.getLogger(__name__)

ConsoleOutputHandler = logging.StreamHandler()
logger.addHandler(ConsoleOutputHandler)


