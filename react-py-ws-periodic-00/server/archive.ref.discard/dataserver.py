from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from time import sleep
from threading import Thread
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

# Enable CORS for the app, 
# means it can be accessed from other pages 
# originated from other webservers
CORS(app)  
# socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")
# socketio = SocketIO(app,  cors_allowed_origins="*")
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

def generate_data():
    while True:
        data = {
            "x": [random.uniform(-10, 10) for _ in range(10)],
            "y": [random.uniform(0, 20) for _ in range(10)],
            "z": [random.uniform(0, 1000) for _ in range(10)]
        }
        socketio.emit('data', data, broadcast=True)
        sleep(5)  # control frame rate here.

@app.route('/')
def index():
    return "Server is running."

if __name__ == '__main__':
    thread = Thread(target=generate_data)
    thread.start()
    socketio.run(app, debug=True)
