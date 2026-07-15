import uuid
from datetime import datetime

from app.models.enums import NotificationType
from app.schemas.common import ORMBase


class NotificationOut(ORMBase):
    id: uuid.UUID
    type: NotificationType
    title: str
    content: str
    link: str | None = None
    is_read: bool
    created_at: datetime
