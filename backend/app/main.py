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


class GameConfigs:
    def __init__(self):
        self.players_scores = {}

    def add_player(self, client_id:int):
        self.players_scores[client_id] = 0
    
    def remove_player(self, client_id:int):
        if client_id in self.players_scores:
            del self.players_scores[client_id]
    
    def get_score(self, client_id:int):
        return self.players_scores[client_id]

    def add_points(self, client_id:int, points:int):
        self.players_scores[client_id] += points

    def get_score_table(self):
        return [{"name": name, "score" : score} for name, score in self.players_scores.items()]



class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: int):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        # send generated board
        await websocket.send_json({"type": "board", "message":"Connected", "board": board_indexes})

    def disconnect(self, client_id: int):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_json({"message":message})

    async def broadcast_text(self, message: str, client_id):
        for client, connection in self.active_connections.items():
            if client != client_id:
                await connection.send_text(message)

    async def broadcast_json(self, message, client_id:int=None):
        for client, connection in self.active_connections.items():
            if client != client_id:
                print(f"Send Message: {message} to client {client_id}")
                await connection.send_json(message)

class AppManger:
    messages_manager = ConnectionManager()
    games_config  = GameConfigs()

app_manager = AppManger()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await app_manager.messages_manager.connect(websocket, client_id)
    # add player
    app_manager.games_config.add_player(client_id)
    await app_manager.messages_manager.broadcast_json({"type":"points", "players" : app_manager.games_config.get_score_table()})
    print("Send table")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"Recieved {data}")
            try:
                json_data = json.loads(data)
                print(json_data)
                if "type" in json_data:
                    if json_data["type"] == "points":
                        app_manager.games_config.add_points(client_id, json_data["points"])
                        await app_manager.messages_manager.broadcast_json({"type":"points", "players" : app_manager.games_config.get_score_table()})
                    elif json_data["type"] == "board":
                        await app_manager.messages_manager.broadcast_json(json_data, client_id)
            except ValueError as e:
                await websocket.send_json({"type": "board", "message": f"Error {e}"})

    except WebSocketDisconnect:
        # remove from players
        app_manager.games_config.remove_player(client_id)
        # update score table
        await app_manager.messages_manager.broadcast_json({"type":"points", "players" : app_manager.games_config.get_score_table()}, client_id)

        await app_manager.messages_manager.broadcast_json({"type": "board", "message":f"Client #{client_id} diconnected"}, client_id)
        
        app_manager.messages_manager.disconnect(client_id)

