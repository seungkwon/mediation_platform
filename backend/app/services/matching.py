from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ServiceRequestStatus
from app.models.service_request import ServiceRequest


async def expire_overdue_requests(db: AsyncSession) -> None:
    """마감시간이 지났는데 아직 open인 요청을 expired로 일괄 전이 (조회 시점 lazy evaluation)."""
    await db.execute(
        update(ServiceRequest)
        .where(ServiceRequest.status == ServiceRequestStatus.open, ServiceRequest.bid_deadline < datetime.now(timezone.utc))
        .values(status=ServiceRequestStatus.expired)
    )
    await db.commit()
