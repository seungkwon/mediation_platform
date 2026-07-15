from fastapi import APIRouter

from app.api.v1 import auth, categories, portfolios, sellers, uploads, users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(uploads.router)
api_router.include_router(sellers.router)
api_router.include_router(portfolios.router)
