from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
from random import random
import math

app = FastAPI()

board_width = 4
board_height = 4

def shuffle_array(array):
    for i in range(len(array)):
        j = math.floor(random() * (i + 1))
        array[i], array[j] = array[j], array[i]
    return array


board_indexes = shuffle_array([i for i in range(board_width*board_height)])

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: int):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        # send generated board
        await websocket.send_json({"message":"Connected", "board": board_indexes})

    def disconnect(self, client_id: int):
        del self.active_connections[client_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_json({"message":message})

    async def broadcast_text(self, message: str, client_id):
        for client, connection in self.active_connections.items():
            if client != client_id:
                await connection.send_text(message)

    async def broadcast_json(self, message, client_id:int):
        for client, connection in self.active_connections.items():
            if client != client_id:
                await connection.send_json(message)


manager = ConnectionManager()


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Recieved {data}")
            try:
                json_data = json.loads(data)
                print(json_data)
                await manager.broadcast_json(json_data, client_id)
            except ValueError as e:
                await websocket.send_json({"message": f"Error {e}"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast_json({"message":f"Client #{client_id} diconnected"}, client_id)