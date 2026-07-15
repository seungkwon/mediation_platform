"""수동 WebSocket 채팅 검증 스크립트. 서버가 8001 포트에 떠 있어야 함.

사용법: uv run python tests/manual_ws_test.py <buyer_token> <seller_token> <room_id>
"""

import asyncio
import sys

import websockets


async def main() -> None:
    buyer_token, seller_token, room_id = sys.argv[1], sys.argv[2], sys.argv[3]
    buyer_uri = f"ws://localhost:8001/api/v1/ws/chat/{room_id}?token={buyer_token}"
    seller_uri = f"ws://localhost:8001/api/v1/ws/chat/{room_id}?token={seller_token}"

    async with websockets.connect(buyer_uri) as buyer_ws, websockets.connect(seller_uri) as seller_ws:
        await buyer_ws.send('{"message_type": "text", "content": "hello, question about the logo"}')
        # broadcast() sends to every connection in the room, including the sender (multi-tab sync),
        # so drain the buyer's own echo before waiting for the seller's reply.
        echo_to_buyer = await asyncio.wait_for(buyer_ws.recv(), timeout=5)
        print("buyer received own echo:", echo_to_buyer)
        reply = await asyncio.wait_for(seller_ws.recv(), timeout=5)
        print("seller received:", reply)

        await seller_ws.send('{"message_type": "text", "content": "sure, please share details"}')
        echo_to_seller = await asyncio.wait_for(seller_ws.recv(), timeout=5)
        print("seller received own echo:", echo_to_seller)
        reply2 = await asyncio.wait_for(buyer_ws.recv(), timeout=5)
        print("buyer received:", reply2)


if __name__ == "__main__":
    asyncio.run(main())
