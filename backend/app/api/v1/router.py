from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    categories,
    chat,
    faq,
    notices,
    notifications,
    portfolios,
    qna,
    quotes,
    resources,
    reviews,
    sellers,
    service_requests,
    uploads,
    users,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(uploads.router)
api_router.include_router(sellers.router)
api_router.include_router(portfolios.router)
api_router.include_router(service_requests.router)
api_router.include_router(quotes.router)
api_router.include_router(chat.router)
api_router.include_router(reviews.router)
api_router.include_router(admin.router)
api_router.include_router(notifications.router)
api_router.include_router(notices.router)
api_router.include_router(qna.router)
api_router.include_router(faq.router)
api_router.include_router(resources.router)
