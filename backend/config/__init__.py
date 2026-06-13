"""EcoLoop AI - Configuration module."""

from config.settings import Settings, get_settings
from config.aws import (
    get_s3_client,
    get_bedrock_client,
    get_dynamodb_resource,
    get_assessments_table,
    get_usermetrics_table,
)

__all__ = [
    "Settings",
    "get_settings",
    "get_s3_client",
    "get_bedrock_client",
    "get_dynamodb_resource",
    "get_assessments_table",
    "get_usermetrics_table",
]
