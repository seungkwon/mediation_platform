import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import FaqStatus


class FaqPost(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "faq_posts"

    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[FaqStatus] = mapped_column(String(20), default=FaqStatus.draft)

    author: Mapped["User"] = relationship()  # noqa: F821
