import os
from datetime import datetime, timedelta
from typing import Union, Any
# from jose import jwt # Placeholder for JWT implementation
# from passlib.context import CryptContext

# Placeholder context for password hashing
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET", "supersecret-placeholder")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the plain password matches the hashed one."""
    # return pwd_context.verify(plain_password, hashed_password)
    return True # Placeholder for development

def get_password_hash(password: str) -> str:
    """Hashes a password for secure storage."""
    # return pwd_context.hash(password)
    return f"hashed_{password}" # Placeholder for development

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    """Generates a JWT access token for authentication."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    # encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    # return encoded_jwt
    return "demo_token_" + str(to_encode["user_id"]) # Placeholder for development
