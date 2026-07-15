import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.admin import Dispute, Report
from app.models.enums import DisputeStatus, NotificationType, ReportStatus
from app.models.notification import Notification
from app.models.quote import Quote
from app.models.service_request import ServiceRequest
from app.models.user import User
from app.schemas.admin import DisputeCreate, DisputeOut, DisputeUpdate, ReportCreate, ReportOut, ReportUpdate

router = APIRouter(tags=["admin"])

_TERMINAL_REPORT_STATUSES = (ReportStatus.resolved, ReportStatus.rejected)
_TERMINAL_DISPUTE_STATUSES = (DisputeStatus.resolved,)


@router.post("/reports", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    payload: ReportCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Report:
    report = Report(reporter_id=user.id, **payload.model_dump())
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.post("/disputes", response_model=DisputeOut, status_code=status.HTTP_201_CREATED)
async def create_dispute(
    payload: DisputeCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Dispute:
    req = await db.get(ServiceRequest, payload.service_request_id)
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "서비스 요청을 찾을 수 없습니다.")

    is_participant = req.buyer_id == user.id
    if not is_participant:
        quote_exists = (
            await db.execute(select(Quote.id).where(Quote.service_request_id == req.id, Quote.seller_id == user.id))
        ).scalar_one_or_none()
        is_participant = quote_exists is not None
    if not is_participant:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "해당 거래의 구매자 또는 견적 제출자만 분쟁을 제기할 수 있습니다.")

    dispute = Dispute(service_request_id=req.id, raised_by=user.id, description=payload.description)
    db.add(dispute)
    await db.commit()
    await db.refresh(dispute)
    return dispute


@router.get("/admin/reports", response_model=list[ReportOut])
async def list_reports(
    status_filter: ReportStatus | None = Query(default=None, alias="status"),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[Report]:
    query = select(Report).order_by(Report.created_at.desc())
    if status_filter is not None:
        query = query.where(Report.status == status_filter)
    return list((await db.execute(query)).scalars().all())


@router.patch("/admin/reports/{report_id}", response_model=ReportOut)
async def update_report(
    report_id: uuid.UUID,
    payload: ReportUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Report:
    report = await db.get(Report, report_id)
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "신고를 찾을 수 없습니다.")

    report.status = payload.status
    report.admin_note = payload.admin_note
    report.resolved_at = datetime.now(timezone.utc) if payload.status in _TERMINAL_REPORT_STATUSES else None

    db.add(
        Notification(
            user_id=report.reporter_id,
            type=NotificationType.report_update,
            title="신고 처리 상태가 변경되었습니다",
            content=f"신고 상태가 '{payload.status.value}'(으)로 변경되었습니다.",
            link="/my/reports",
        )
    )
    await db.commit()
    await db.refresh(report)
    return report


@router.get("/admin/disputes", response_model=list[DisputeOut])
async def list_disputes(
    status_filter: DisputeStatus | None = Query(default=None, alias="status"),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[Dispute]:
    query = select(Dispute).order_by(Dispute.created_at.desc())
    if status_filter is not None:
        query = query.where(Dispute.status == status_filter)
    return list((await db.execute(query)).scalars().all())


@router.patch("/admin/disputes/{dispute_id}", response_model=DisputeOut)
async def update_dispute(
    dispute_id: uuid.UUID,
    payload: DisputeUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Dispute:
    dispute = await db.get(Dispute, dispute_id)
    if dispute is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "분쟁을 찾을 수 없습니다.")

    dispute.status = payload.status
    dispute.admin_note = payload.admin_note
    dispute.resolved_at = datetime.now(timezone.utc) if payload.status in _TERMINAL_DISPUTE_STATUSES else None

    db.add(
        Notification(
            user_id=dispute.raised_by,
            type=NotificationType.dispute_update,
            title="분쟁 처리 상태가 변경되었습니다",
            content=f"분쟁 상태가 '{payload.status.value}'(으)로 변경되었습니다.",
            link=f"/requests/{dispute.service_request_id}",
        )
    )
    await db.commit()
    await db.refresh(dispute)
    return dispute
