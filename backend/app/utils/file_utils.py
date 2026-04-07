import os
from datetime import datetime
from typing import List, Optional
import uuid

def is_allowed_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """Checks if a file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions

def generate_secure_filename(original_filename: str, prefix: Optional[str] = None) -> str:
    """Generates a secure, unique filename for storage."""
    ext = original_filename.rsplit(".", 1)[1].lower() if "." in original_filename else "bin"
    unique_id = uuid.uuid4().hex
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if prefix:
        return f"{prefix}_{timestamp}_{unique_id}.{ext}"
    return f"file_{timestamp}_{unique_id}.{ext}"

def ensure_directory_exists(directory_path: str):
    """Ensures that a directory exists, creating it if necessary."""
    if not os.path.exists(directory_path):
        os.makedirs(directory_path, exist_ok=True)
