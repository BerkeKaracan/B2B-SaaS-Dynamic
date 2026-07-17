import re
import uuid
from urllib.parse import quote

import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from botocore.config import Config

from core.config import settings
from core.database import supabase

router = APIRouter(
    prefix="/api/storage",
    tags=["Storage"],
)

security = HTTPBearer()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


class GenerateUploadUrlRequest(BaseModel):
    fileName: str = Field(..., min_length=1)
    contentType: str = Field(..., min_length=1)


class GenerateUploadUrlResponse(BaseModel):
    presignedUrl: str
    fileUrl: str
    fileKey: str


def _safe_filename(file_name: str) -> str:
    base = file_name.strip().replace("\\", "/").split("/")[-1]
    base = re.sub(r"[^\w.\-]+", "_", base, flags=re.UNICODE)
    return base or "file"


@router.post("/generate-upload-url", response_model=GenerateUploadUrlResponse)
def generate_upload_url(
    request_data: GenerateUploadUrlRequest,
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> GenerateUploadUrlResponse:
    token = creds.credentials
    user_res = supabase.auth.get_user(token)
    if not user_res or not user_res.user:
        raise HTTPException(status_code=401, detail="Invalid session")

    if request_data.contentType not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, and WEBP are supported.",
        )

    safe_name = _safe_filename(request_data.fileName)
    file_key = f"avatars/{uuid.uuid4()}-{safe_name}"

    try:
        s3_client = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION"),
            endpoint_url=f"https://s3.{os.getenv('AWS_REGION')}.amazonaws.com",
            config=Config(signature_version="s3v4"),
        )
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.AWS_S3_BUCKET_NAME,
                "Key": file_key,
                "ContentType": request_data.contentType,
            },
            ExpiresIn=300,
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate upload URL: {exc}",
        ) from exc

    encoded_key = quote(file_key, safe="/")
    file_url = (
        f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}"
        f".amazonaws.com/{encoded_key}"
    )

    return GenerateUploadUrlResponse(
        presignedUrl=presigned_url,
        fileUrl=file_url,
        fileKey=file_key,
    )
