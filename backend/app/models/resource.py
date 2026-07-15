import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import ResourceStatus


class ResourcePost(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "resource_posts"

    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[ResourceStatus] = mapped_column(String(20), default=ResourceStatus.draft)

    author: Mapped["User"] = relationship()  # noqa: F821
    attachments: Mapped[list["ResourceAttachment"]] = relationship(
        back_populates="resource_post", cascade="all, delete-orphan", order_by="ResourceAttachment.sort_order"
    )


class ResourceAttachment(UUIDPKMixin, Base):
    __tablename__ = "resource_attachments"

    resource_post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resource_posts.id", ondelete="CASCADE")
    )
    file_path: Mapped[str] = mapped_column(String(500))
    original_filename: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    resource_post: Mapped["ResourcePost"] = relationship(back_populates="attachments")
