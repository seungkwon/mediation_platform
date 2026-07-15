import uuid
from collections import defaultdict

from fastapi import WebSocket


class ChatConnectionManager:
    """단일 프로세스 기준 in-memory 채팅방 연결 관리자."""

    def __init__(self) -> None:
        self._rooms: dict[uuid.UUID, dict[WebSocket, uuid.UUID]] = defaultdict(dict)

    async def connect(self, room_id: uuid.UUID, websocket: WebSocket, user_id: uuid.UUID) -> None:
        await websocket.accept()
        self._rooms[room_id][websocket] = user_id

    def disconnect(self, room_id: uuid.UUID, websocket: WebSocket) -> None:
        self._rooms[room_id].pop(websocket, None)
        if not self._rooms[room_id]:
            del self._rooms[room_id]

    def is_user_connected(self, room_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        return user_id in self._rooms.get(room_id, {}).values()

    async def broadcast(self, room_id: uuid.UUID, message: dict) -> None:
        for ws in list(self._rooms.get(room_id, {})):
            await ws.send_json(message)


manager = ChatConnectionManager()
