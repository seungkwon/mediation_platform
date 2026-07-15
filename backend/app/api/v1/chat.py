import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import ValidationError
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.security import TokenType, decode_token
from app.db.session import AsyncSessionLocal, get_db
from app.models.chat import ChatMessage, ChatRoom
from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageOut, ChatRoomOut
from app.ws.manager import manager

router = APIRouter(tags=["chat"])


async def _get_room_or_404(db: AsyncSession, room_id: uuid.UUID) -> ChatRoom:
    result = await db.execute(
        select(ChatRoom)
        .options(selectinload(ChatRoom.buyer), selectinload(ChatRoom.seller), selectinload(ChatRoom.service_request))
        .where(ChatRoom.id == room_id)
    )
    room = result.scalar_one_or_none()
    if room is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "채팅방을 찾을 수 없습니다.")
    return room


def _ensure_participant(room: ChatRoom, user_id: uuid.UUID) -> None:
    if room.buyer_id != user_id and room.seller_id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "채팅방 참여자만 접근할 수 있습니다.")


@router.get("/chat/rooms", response_model=list[ChatRoomOut])
async def list_chat_rooms(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[ChatRoomOut]:
    result = await db.execute(
        select(ChatRoom)
        .options(
            selectinload(ChatRoom.buyer),
            selectinload(ChatRoom.seller),
            selectinload(ChatRoom.service_request),
            selectinload(ChatRoom.messages),
        )
        .where(or_(ChatRoom.buyer_id == user.id, ChatRoom.seller_id == user.id))
        .order_by(ChatRoom.created_at.desc())
    )
    rooms = result.scalars().all()

    out = []
    for room in rooms:
        last = room.messages[-1] if room.messages else None
        out.append(
            ChatRoomOut(
                id=room.id,
                service_request_id=room.service_request_id,
                service_request_title=room.service_request.title,
                buyer=room.buyer,
                seller=room.seller,
                last_message=last.content if last else None,
                last_message_at=last.created_at if last else None,
                created_at=room.created_at,
            )
        )
    return out


@router.get("/chat/rooms/{room_id}/messages", response_model=list[ChatMessageOut])
async def list_chat_messages(
    room_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[ChatMessage]:
    room = await _get_room_or_404(db, room_id)
    _ensure_participant(room, user.id)

    result = await db.execute(
        select(ChatMessage).where(ChatMessage.chat_room_id == room_id).order_by(ChatMessage.created_at)
    )
    return list(result.scalars().all())


async def _authenticate_ws(token: str, db: AsyncSession) -> User | None:
    try:
        payload = decode_token(token)
    except ValueError:
        return None
    if payload.get("type") != TokenType.access.value:
        return None
    return await db.get(User, uuid.UUID(payload["sub"]))


@router.websocket("/ws/chat/{room_id}")
async def chat_websocket(websocket: WebSocket, room_id: uuid.UUID, token: str) -> None:
    async with AsyncSessionLocal() as db:
        user = await _authenticate_ws(token, db)
        if user is None:
            await websocket.close(code=4401)
            return

        room = await db.get(ChatRoom, room_id)
        if room is None or (room.buyer_id != user.id and room.seller_id != user.id):
            await websocket.close(code=4403)
            return

        other_user_id = room.seller_id if user.id == room.buyer_id else room.buyer_id

    await manager.connect(room_id, websocket, user.id)
    try:
        while True:
            raw = await websocket.receive_json()
            try:
                payload = ChatMessageCreate.model_validate(raw)
            except ValidationError:
                await websocket.send_json({"error": "invalid message payload"})
                continue

            async with AsyncSessionLocal() as db:
                message = ChatMessage(
                    chat_room_id=room_id,
                    sender_id=user.id,
                    message_type=payload.message_type,
                    content=payload.content,
                    file_path=payload.file_path,
                )
                db.add(message)

                if not manager.is_user_connected(room_id, other_user_id):
                    db.add(
                        Notification(
                            user_id=other_user_id,
                            type=NotificationType.new_message,
                            title="새 채팅 메시지",
                            content=payload.content or "새 메시지가 도착했습니다.",
                            link=f"/chat/{room_id}",
                        )
                    )

                await db.commit()
                await db.refresh(message)
                out = ChatMessageOut.model_validate(message)

            await manager.broadcast(room_id, out.model_dump(mode="json"))
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(room_id, websocket)
