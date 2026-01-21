import os
from typing import Any, Dict

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", "").strip() or (
    SUPABASE_URL.rstrip("/") + "/auth/v1/certs" if SUPABASE_URL else ""
)

security = HTTPBearer(auto_error=True)

jwks_cache: Dict[str, Any] | None = None


async def get_jwks() -> Dict[str, Any]:
    global jwks_cache
    if jwks_cache is None:
        if not SUPABASE_JWKS_URL:
            raise RuntimeError("SUPABASE_JWKS_URL is not configured")
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(SUPABASE_JWKS_URL)
            resp.raise_for_status()
            jwks_cache = resp.json()
    return jwks_cache  # type: ignore


async def verify_jwt(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    token = creds.credentials
    jwks = await get_jwks()
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    try:
        payload = jwt.decode(
            token, key, options={"verify_aud": False, "verify_at_hash": False}
        )
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/me")
async def me(payload: Dict[str, Any] = Depends(verify_jwt)):
    return {"user_id": payload.get("sub"), "email": payload.get("email")}


@app.post("/assign-weekend/{weekend_id}")
async def assign_weekend(
    weekend_id: str, _payload: Dict[str, Any] = Depends(verify_jwt)
):
    # Stubbed dummy assignments
    return {
        "weekend_id": weekend_id,
        "assignments": [
            {"user_id": "u1", "group": "A", "time": "8:10 AM"},
            {"user_id": "u2", "group": "B", "time": "8:20 AM"},
        ],
    }


@app.post("/trades/validate")
async def validate_trade(_payload: Dict[str, Any] = Depends(verify_jwt)):
    return {"valid": True}
