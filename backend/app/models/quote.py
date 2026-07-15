import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import QuoteStatus


class Quote(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "quotes"
    __table_args__ = (UniqueConstraint("service_request_id", "seller_id", name="uq_quote_request_seller"),)

    service_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE")
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    price: Mapped[int] = mapped_column(Integer)
    delivery_days: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[QuoteStatus] = mapped_column(String(20), default=QuoteStatus.submitted)
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    service_request: Mapped["ServiceRequest"] = relationship(  # noqa: F821
        back_populates="quotes", foreign_keys=[service_request_id]
    )
    seller: Mapped["User"] = relationship(foreign_keys=[seller_id])  # noqa: F821
    attachments: Mapped[list["QuoteAttachment"]] = relationship(
        back_populates="quote", cascade="all, delete-orphan"
    )


class QuoteAttachment(UUIDPKMixin, Base):
    __tablename__ = "quote_attachments"

    quote_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotes.id", ondelete="CASCADE"))
    file_path: Mapped[str] = mapped_column(String(500))
    original_filename: Mapped[str] = mapped_column(String(255))

    quote: Mapped["Quote"] = relationship(back_populates="attachments")
