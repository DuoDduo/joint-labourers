from fastapi import APIRouter

from app.api.v1 import auth, needs, prayer, public

api_router = APIRouter()
api_router.include_router(public.health)
api_router.include_router(auth.router)
api_router.include_router(public.router)
api_router.include_router(needs.router)
api_router.include_router(prayer.router)
