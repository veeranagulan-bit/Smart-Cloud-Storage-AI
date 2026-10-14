import os
import re
from pathlib import Path
from io import BytesIO
import boto3
from botocore.exceptions import ClientError
from app.config import settings

def sanitize_filename(filename: str) -> str:
    # Protect against path traversal and unsafe characters
    cleaned = os.path.basename(filename)
    cleaned = re.sub(r'[^a-zA-Z0-9._\-\s]', '_', cleaned)
    return cleaned.strip() or "unnamed_file"

class StorageProvider:
    def save_file(self, file_id: str, filename: str, content: bytes, user_id: str) -> str:
        raise NotImplementedError

    def get_file_bytes(self, storage_key: str) -> bytes:
        raise NotImplementedError

    def delete_file(self, storage_key: str) -> bool:
        raise NotImplementedError

class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, storage_key: str) -> Path:
        # Prevent path traversal
        clean_key = Path(storage_key).as_posix().lstrip("/")
        full_path = (self.base_dir / clean_key).resolve()
        if not str(full_path).startswith(str(self.base_dir.resolve())):
            raise ValueError("Path traversal attempt detected")
        return full_path

    def save_file(self, file_id: str, filename: str, content: bytes, user_id: str) -> str:
        clean_name = sanitize_filename(filename)
        user_dir = self.base_dir / sanitize_filename(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        
        target_path = user_dir / f"{file_id}_{clean_name}"
        target_path.write_bytes(content)
        return f"{sanitize_filename(user_id)}/{file_id}_{clean_name}"

    def get_file_bytes(self, storage_key: str) -> bytes:
        target_path = self._resolve_path(storage_key)
        if not target_path.exists():
            raise FileNotFoundError(f"Storage file not found: {storage_key}")
        return target_path.read_bytes()

    def delete_file(self, storage_key: str) -> bool:
        try:
            target_path = self._resolve_path(storage_key)
            if target_path.exists():
                target_path.unlink()
                return True
        except Exception:
            pass
        return False

class S3StorageProvider(StorageProvider):
    def __init__(self, bucket_name: str, region: str, access_key: str, secret_key: str):
        self.bucket_name = bucket_name
        self.s3_client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key or None,
            aws_secret_access_key=secret_key or None
        )

    def save_file(self, file_id: str, filename: str, content: bytes, user_id: str) -> str:
        clean_name = sanitize_filename(filename)
        key = f"vault/{sanitize_filename(user_id)}/{file_id}_{clean_name}"
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=content
        )
        return key

    def get_file_bytes(self, storage_key: str) -> bytes:
        response = self.s3_client.get_object(Bucket=self.bucket_name, Key=storage_key)
        return response["Body"].read()

    def delete_file(self, storage_key: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=storage_key)
            return True
        except ClientError:
            return False

def get_storage() -> StorageProvider:
    if settings.STORAGE_BACKEND.lower() == "s3" and settings.AWS_ACCESS_KEY_ID:
        return S3StorageProvider(
            bucket_name=settings.S3_BUCKET_NAME,
            region=settings.AWS_REGION,
            access_key=settings.AWS_ACCESS_KEY_ID,
            secret_key=settings.AWS_SECRET_ACCESS_KEY
        )
    return LocalStorageProvider(settings.LOCAL_STORAGE_DIR)
