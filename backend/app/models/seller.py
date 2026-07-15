import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import PortfolioStatus


class SellerProfile(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "seller_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    headline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    career_years: Mapped[int | None] = mapped_column(Integer, nullable=True)

    user: Mapped["User"] = relationship(back_populates="seller_profile")  # noqa: F821
    portfolio_posts: Mapped[list["PortfolioPost"]] = relationship(
        back_populates="seller_profile", cascade="all, delete-orphan"
    )


class PortfolioPost(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "portfolio_posts"

    seller_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("seller_profiles.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[PortfolioStatus] = mapped_column(String(20), default=PortfolioStatus.draft)

    seller_profile: Mapped["SellerProfile"] = relationship(back_populates="portfolio_posts")
