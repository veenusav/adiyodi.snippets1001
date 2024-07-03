print(".vav | BEGIN")
VIDEO_FILE_TO_CAST = "E:\\temp\\Movies\\Sherlock.Holmes.A.Game.Of.Shadows.2011.1080P.Brrip.X264.Yify-1.m4v"
print(".")
print("Publishing content:", VIDEO_FILE_TO_CAST)
print(".")

import asyncio
import json
import websockets
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack, RTCConfiguration, RTCIceCandidate
from aiortc.contrib.media import MediaPlayer
import logging

logging.basicConfig(level=logging.INFO)

pcs = set()
class VideoFrameTrack(VideoStreamTrack):
    frame_count=-1
    def __init__(self, video_path):
        print(".vav | VideoFrameTrack::__init__ : video_path: ", video_path)        
        super().__init__()
        self.player = MediaPlayer(video_path)

    async def recv(self):
        frame = await self.player.video.recv()
        
        #logic to print indications for the first few frames
        global frame_count
        self.frame_count +=1
        if(self.frame_count < 10 ) : # print only few frames
            print(".")        
        return frame

#logic to include custom stun server(s)
from aiortc import RTCIceServer
# Define your STUN server URL
configuration = RTCConfiguration(iceServers=[
    RTCIceServer("stun:localhost:3478")  # Assuming your STUN server is on localhost
])


async def offer_handler(websocket, path):
    print(".vav | offer_handler() begin.")
    async for message in websocket:
        params = json.loads(message)
        print(".vav | offer_handler() message in websocket:", params)
        print(".")
        print(".")
        if params['type'] == 'offer':
            print("**********************************************************************************")
            offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])

            pc = RTCPeerConnection(configuration)

            pcs.add(pc)

            @pc.on("icecandidate")
            async def on_icecandidate(candidate):
                print("===============================================================================")
                print(".vav | offer_handler()::on_icecandidate")
                if candidate:
                    await websocket.send(json.dumps({
                        "type": "candidate",
                        "candidate": candidate.candidate,
                        "sdpMid": candidate.sdpMid,
                        "sdpMLineIndex": candidate.sdpMLineIndex
                    }))

            video_track = VideoFrameTrack(VIDEO_FILE_TO_CAST)
            pc.addTrack(video_track)

            await pc.setRemoteDescription(offer)
            answer = await pc.createAnswer()
            
            await pc.setLocalDescription(answer)

            await websocket.send(json.dumps({
                "sdp": pc.localDescription.sdp,
                "type": pc.localDescription.type
            }))

        elif params['type'] == 'candidate':
            print("-----------------------------------------------------------------------------------")
            candidate = RTCIceCandidate(
                sdp=params['candidate'],
                sdpMid=params['sdpMid'],
                sdpMLineIndex=params['sdpMLineIndex']
            )
            if 'pc' in locals():
                await pc.addIceCandidate(candidate)
            else:
                logging.warning("Attempted to add ICE candidate without an active peer connection.")
    print(".vav | offer_handler() end.")
print(".vav | before websockets.serve() or creation of the socket.")
start_server = websockets.serve(offer_handler, "localhost", 8080)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
print(".vav | END")