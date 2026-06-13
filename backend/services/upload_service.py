"""
EcoLoop AI - Upload Service

Handles file validation and S3 storage for product images.
"""

import uuid
from fastapi import UploadFile, HTTPException, status
from botocore.exceptions import BotoCoreError, ClientError

from config.settings import get_settings
from config.aws import get_s3_client

# Allowed MIME types for product images
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}

# Maximum file size: 10 MB
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def validate_file(file: UploadFile) -> None:
    """
    Validate uploaded file type and size.

    Raises HTTPException with 400 status if validation fails.
    """
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_format",
                "message": f"File must be JPEG, PNG, or WebP format. Got: {file.content_type}",
            },
        )

    # Validate file size (check Content-Length header if available)
    if file.size is not None and file.size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "file_too_large",
                "message": f"File size exceeds 10 MB limit. Got: {file.size / (1024 * 1024):.1f} MB",
            },
        )


def generate_image_key(original_filename: str) -> str:
    """
    Generate a unique S3 object key for the uploaded image.

    Format: uploads/<uuid>/<original_filename>
    """
    unique_id = uuid.uuid4().hex
    # Sanitize filename - keep only the last part
    safe_name = original_filename.split("/")[-1].split("\\")[-1]
    return f"uploads/{unique_id}/{safe_name}"


async def upload_to_s3(file: UploadFile, image_key: str) -> str:
    """
    Upload file to S3 and return a pre-signed download URL.

    Args:
        file: The uploaded file object.
        image_key: The S3 object key to store the file under.

    Returns:
        A pre-signed URL for previewing the uploaded image (15-min expiry).

    Raises:
        HTTPException: If S3 upload fails.
    """
    settings = get_settings()
    s3_client = get_s3_client()

    try:
        # Read file content
        file_content = await file.read()

        # Validate actual file size after reading
        if len(file_content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "file_too_large",
                    "message": f"File size exceeds 10 MB limit. Got: {len(file_content) / (1024 * 1024):.1f} MB",
                },
            )

        # Upload to S3
        s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=image_key,
            Body=file_content,
            ContentType=file.content_type,
        )

        # Generate pre-signed URL for preview (15-minute expiry)
        preview_url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.s3_bucket_name,
                "Key": image_key,
            },
            ExpiresIn=900,  # 15 minutes
        )

        return preview_url

    except HTTPException:
        # Re-raise validation errors
        raise
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "upload_failed",
                "message": f"Failed to upload image to storage: {str(e)}",
            },
        )
