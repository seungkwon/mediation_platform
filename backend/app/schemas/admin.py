import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import AdminRole, DisputeStatus, ReportStatus, ReportTargetType, UserRole
from app.schemas.common import ORMBase


class ReportCreate(BaseModel):
    target_type: ReportTargetType
    target_id: uuid.UUID
    reason: str = Field(min_length=1)


class ReportUpdate(BaseModel):
    status: ReportStatus
    admin_note: str | None = None


class ReportOut(ORMBase):
    id: uuid.UUID
    reporter_id: uuid.UUID
    target_type: ReportTargetType
    target_id: uuid.UUID
    reason: str
    status: ReportStatus
    admin_note: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None


class DisputeCreate(BaseModel):
    service_request_id: uuid.UUID
    description: str = Field(min_length=1)


class DisputeUpdate(BaseModel):
    status: DisputeStatus
    admin_note: str | None = None


class DisputeOut(ORMBase):
    id: uuid.UUID
    service_request_id: uuid.UUID
    raised_by: uuid.UUID
    description: str
    status: DisputeStatus
    admin_note: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None


class AdminUserSummary(ORMBase):
    id: uuid.UUID
    email: str
    name: str
    phone: str | None = None
    profile_image_path: str | None = None
    is_active: bool
    active_role: UserRole
    admin_role: AdminRole | None = None
    created_at: datetime
    last_login_at: datetime | None = None


class AdminRoleGrant(BaseModel):
    role: AdminRole = AdminRole.moderator
