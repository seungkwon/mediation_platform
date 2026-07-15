import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import ServiceRequestStatus


class ServiceRequest(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "service_requests"

    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    budget_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    budget_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bid_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[ServiceRequestStatus] = mapped_column(String(20), default=ServiceRequestStatus.open)
    selected_quote_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quotes.id", ondelete="SET NULL", use_alter=True, name="fk_service_requests_selected_quote_id"),
        nullable=True,
    )

    buyer: Mapped["User"] = relationship(foreign_keys=[buyer_id])  # noqa: F821
    images: Mapped[list["ServiceRequestImage"]] = relationship(
        back_populates="service_request", cascade="all, delete-orphan", order_by="ServiceRequestImage.sort_order"
    )
    attachments: Mapped[list["ServiceRequestAttachment"]] = relationship(
        back_populates="service_request", cascade="all, delete-orphan"
    )
    quotes: Mapped[list["Quote"]] = relationship(
        back_populates="service_request",
        cascade="all, delete-orphan",
        foreign_keys="Quote.service_request_id",
    )


class ServiceRequestImage(UUIDPKMixin, Base):
    __tablename__ = "service_request_images"

    service_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE")
    )
    file_path: Mapped[str] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    service_request: Mapped["ServiceRequest"] = relationship(back_populates="images")


class ServiceRequestAttachment(UUIDPKMixin, Base):
    __tablename__ = "service_request_attachments"

    service_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE")
    )
    file_path: Mapped[str] = mapped_column(String(500))
    original_filename: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)

    service_request: Mapped["ServiceRequest"] = relationship(back_populates="attachments")
