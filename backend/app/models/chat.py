import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import ChatMessageType


class ChatRoom(UUIDPKMixin, Base):
    __tablename__ = "chat_rooms"
    __table_args__ = (UniqueConstraint("service_request_id", "seller_id", name="uq_chat_room_request_seller"),)

    service_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE")
    )
    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    seller_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    service_request: Mapped["ServiceRequest"] = relationship()  # noqa: F821
    buyer: Mapped["User"] = relationship(foreign_keys=[buyer_id])  # noqa: F821
    seller: Mapped["User"] = relationship(foreign_keys=[seller_id])  # noqa: F821
    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="chat_room", cascade="all, delete-orphan", order_by="ChatMessage.created_at"
    )


class ChatMessage(UUIDPKMixin, Base):
    __tablename__ = "chat_messages"

    chat_room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_rooms.id", ondelete="CASCADE")
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    message_type: Mapped[ChatMessageType] = mapped_column(String(20), default=ChatMessageType.text)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    chat_room: Mapped["ChatRoom"] = relationship(back_populates="messages")
