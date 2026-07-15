import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import ChatMessageType
from app.schemas.common import ORMBase
from app.schemas.user import UserPublic


class ChatRoomOut(ORMBase):
    id: uuid.UUID
    service_request_id: uuid.UUID
    service_request_title: str
    buyer: UserPublic
    seller: UserPublic
    last_message: str | None = None
    last_message_at: datetime | None = None
    created_at: datetime


class ChatMessageCreate(BaseModel):
    message_type: ChatMessageType = ChatMessageType.text
    content: str | None = None
    file_path: str | None = None


class ChatMessageOut(ORMBase):
    id: uuid.UUID
    chat_room_id: uuid.UUID
    sender_id: uuid.UUID
    message_type: ChatMessageType
    content: str | None = None
    file_path: str | None = None
    read_at: datetime | None = None
    created_at: datetime
