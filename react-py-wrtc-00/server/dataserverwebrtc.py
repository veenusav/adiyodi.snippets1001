import json
import random
import time
import asyncio
from aiortc import RTCPeerConnection, RTCSessionDescription
# # message="{\"sdp\":\"v=0\r\no=- 5543019110918088187 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n\",\"type\":\"offer\"}"
# message="{\"sdp\":\"v=0 o=- 5543019110918088187 2 IN IP4 127.0.0.1 s=- t=0 0 a=extmap-allow-mixed a=msid-semantic: WMS \",\"type\":\"offer\"}"
# params = json.loads(message)
# print("params = ")
# print("====================")
# print(params)
# print("====================")
# c = params['sdp']
# print("c= ",c)
# exit()

###### test notes:
# Good case:
# ====================
# {'sdp': 'v=0 o=- 5543019110918088187 2 IN IP4 127.0.0.1 s=- t=0 0 a=extmap-allow-mixed a=msid-semantic: WMS ', 'type': 'offer'}
# ====================

# Current case:
# ====================
# {"sdp":"v=0  o=- 1419090508695902548 2 IN IP4 127.0.0.1  s=-  t=0 0  a=extmap-allow-mixed  a=msid-semantic: WMS  ","type":"offer"}
# ====================

WEBSOCKET_PORT = 8080
pcs = set()


async def offer_handler(websocket, path):
    print("offer_handler() START.")
    # async for message in websocket:
    #     params = json.loads(message)    
    #     print("params in offer_handler():")
    #     print(params)
    #     print("params[\'sdp']",params['sdp'])
    # return
    message = await websocket.recv()
    params = json.loads(message)    
    print("offer_handler(). params = ")
    print("====================")
    print(params)
    print("====================")
    # a = "v=0\r\no=- 3780914233 3780914233 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:hRz3\r\na=ice-pwd:xYom1LjrH23Rm7jTiYgZutZp\r\na=ice-options:trickle\r\na=fingerprint:sha-256 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF\r\na=setup:actpass\r\na=mid:0\r\na=sctpmap:5000 webrtc-datachannel 256\r\n"
    # b = "v=0\r\no=- 2883676071950459993 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n"
    # c = params['sdp']
    # print("b= ",b)   
    # print("c= ",c)   
    # offer = RTCSessionDescription(sdp=a, type='offer')

    offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])
    pc = RTCPeerConnection()
    pcs.add(pc)
    print("offer_handler(). RTCPeerConnection created waiting for datachannel request. pc=",pc)
    @pc.on('datachannel')
    def on_datachannel(channel):
        print("on_datachannel() START.")        
        @channel.on('message')
        async def on_message(message):
            print("on_datachannel():on_message() START.")        
            while True:
                data = {
                    "x": [random.uniform(-10, 10) for _ in range(10)],
                    "y": [random.uniform(0, 20) for _ in range(10)],
                    "z": [random.uniform(0, 1000) for _ in range(10)],
                    "timestamp": int(time.time() * 1000)  # Adding a timestamp
                }
                data_json = json.dumps(data)
                payload_size = len(data_json.encode('utf-8'))
                data["payloadSize"] = payload_size  # Adding payload size
                await channel.send(json.dumps(data))
                await asyncio.sleep(1 / 30)
            print("on_datachannel():on_message() EXIT.")        
        print("on_datachannel() EXIT.")        
    print("offer_handler(). setRemoteDescription(), createAnswer(), setLocalDescription() to be executed.")
    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    print("offer_handler(). going to reply through websocket. ")
    # await websocket.send(json.dumps({
    #     'sdp': pc.localDescription.sdp,
    #     'type': pc.localDescription.type
    # }))

    response = {
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    }
    await websocket.send(json.dumps(response))
    
    print("offer(). executing websocket.wait_closed()")
    await websocket.wait_closed()

    pcs.discard(pc)
    print("offer() EXIT.")

if __name__ == '__main__':
    import asyncio
    import websockets
    print("Data server initiated.")
    start_server = websockets.serve(offer_handler, 'localhost', WEBSOCKET_PORT)
    print("Websocket started to offer, PORT: ",WEBSOCKET_PORT)
    print("Waiting for the clients to offer WebRTC based data...")

    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
    print("Data server. about to exit...")


# Reference: to be removed
# Websocket based periodic data server
# import asyncio
# import websockets
# import json
# import random
# import time

# async def generate_data(websocket, path):
#     try:
#         while True:
#             data = {
#                 "x": [random.uniform(-10, 10) for _ in range(10)],
#                 "y": [random.uniform(0, 20) for _ in range(10)],
#                 "z": [random.uniform(0, 1000) for _ in range(10)],
#                 "timestamp": int(time.time() * 1000)  
#             }
#             print(f"Emitting data: {data}")
#             await websocket.send(json.dumps(data))
#             await asyncio.sleep(10)
#     except websockets.ConnectionClosed as e:
#         print(f"Connection closed: {e}")

# start_server = websockets.serve(generate_data, "localhost", 8765)

# asyncio.get_event_loop().run_until_complete(start_server)
# print("WebSocket server started on ws://localhost:8765")
# asyncio.get_event_loop().run_forever()
