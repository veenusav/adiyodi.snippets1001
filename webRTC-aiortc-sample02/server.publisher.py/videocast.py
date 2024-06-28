VIDEO_FILE_TO_CAST = "E:\\temp\\Movies\\Sherlock.Holmes.A.Game.Of.Shadows.2011.1080P.Brrip.X264.Yify-1.m4v"
print(".")
print("Publishing content:", VIDEO_FILE_TO_CAST)
print(".")
import asyncio
import json
import websockets
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack, RTCIceCandidate
from aiortc.contrib.media import MediaPlayer
import logging

logging.basicConfig(level=logging.INFO)

pcs = set()

class VideoFrameTrack(VideoStreamTrack):
    def __init__(self, video_path):
        super().__init__()
        self.player = MediaPlayer(video_path)

    async def recv(self):
        frame = await self.player.video.recv()
        return frame

async def offer_handler(websocket, path):
    async for message in websocket:
        params = json.loads(message)

        if params['type'] == 'offer':
            offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])
            pc = RTCPeerConnection()
            pcs.add(pc)

            @pc.on("icecandidate")
            async def on_icecandidate(candidate):
                if candidate:
                    await websocket.send(json.dumps({
                        "type": "candidate",
                        "candidate": candidate.candidate,
                        "sdpMid": candidate.sdpMid,
                        "sdpMLineIndex": candidate.sdpMLineIndex
                    }))

            video_track = VideoFrameTrack(VIDEO_FILE_TO_CAST)
            pc.addTrack(video_track)
            
            print("Offer SDP:\n", offer.sdp)

            await pc.setRemoteDescription(offer)
            answer = await pc.createAnswer()
            print("answer:", answer)
            await pc.setLocalDescription(answer)

            await websocket.send(json.dumps({
                "sdp": pc.localDescription.sdp,
                "type": pc.localDescription.type
            }))

        elif params['type'] == 'candidate':
            # candidate = RTCIceCandidate(
            #     sdp=params['candidate'],
            #     sdpMid=params['sdpMid'],
            #     sdpMLineIndex=params['sdpMLineIndex']
            # )
            if 'pc' in locals():
                print("adding ICE Candidate:", candidate)
                await pc.addIceCandidate(candidate)
            else:
                logging.warning("Attempted to add ICE candidate without an active peer connection.")


start_server = websockets.serve(offer_handler, "localhost", 8080)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()


# import asyncio
# import json
# import websockets
# from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
# import cv2

# import logging
# logging.basicConfig(level=logging.INFO)

# class VideoFrameTrack(VideoStreamTrack):
#     def __init__(self, video_path):
#         super().__init__()  # initialize parent class
#         self.cap = cv2.VideoCapture(video_path)

#     async def recv(self):
#         pts, time_base = await self.next_timestamp()
#         ret, frame = self.cap.read()
#         if not ret:
#             self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
#             ret, frame = self.cap.read()
#         frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         frame = VideoFrame.from_ndarray(frame, format="rgb24")
#         frame.pts = pts
#         frame.time_base = time_base
#         return frame

# pcs = set()

# VIDEO_FILE_TO_CAST = "E:\\temp\\Movies\\Sherlock.Holmes.A.Game.Of.Shadows.2011.1080P.Brrip.X264.Yify-1.m4v"

# async def offer_handler(websocket, path):
#     async for message in websocket:
#         params = json.loads(message)

#         if params['type'] == 'offer':
#             offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])
#             pc = RTCPeerConnection()
#             pcs.add(pc)

#             @pc.on("icecandidate")
#             async def on_icecandidate(candidate):
#                 if candidate:
#                     await websocket.send(json.dumps({
#                         "type": "candidate",
#                         "candidate": candidate.candidate,
#                         "sdpMid": candidate.sdpMid,
#                         "sdpMLineIndex": candidate.sdpMLineIndex
#                     }))

#             video_track = VideoFrameTrack(VIDEO_FILE_TO_CAST)
#             pc.addTrack(video_track)

#             await pc.setRemoteDescription(offer)
#             answer = await pc.createAnswer()
#             await pc.setLocalDescription(answer)

#             await websocket.send(json.dumps({
#                 "sdp": pc.localDescription.sdp,
#                 "type": pc.localDescription.type
#             }))

#         elif params['type'] == 'candidate':
#             candidate = RTCIceCandidate(
#                 sdp=params['candidate'],
#                 sdpMid=params['sdpMid'],
#                 sdpMLineIndex=params['sdpMLineIndex']
#             )
#             await pc.addIceCandidate(candidate)

# start_server = websockets.serve(offer_handler, "localhost", 8080)

# asyncio.get_event_loop().run_until_complete(start_server)
# asyncio.get_event_loop().run_forever()

# # 'v=0\r\no=- 3928536701 3928536701 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=group:BUNDLE \r\na=msid-semantic:WMS *\r\n'



# == some reference code. may not work!
# import cv2
# class VideoTrack(MediaStreamTrack):
#     def __init__(self, path=None, camera_index=None):
#         super().__init__()
#         if path:
#             self.cap = cv2.VideoCapture(path)
#         elif camera_index is not None:
#             self.cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
#         else:
#             raise ValueError("Either path or camera_index must be provided.")

#     async def recv(self):
#         pts, time_base = await self.next_timestamp()
#         ret, frame = self.cap.read()
#         if not ret:
#             self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
#             ret, frame = self.cap.read()
        
#         frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         return frame

# # # Example usage
# # player = VideoTrack(camera_index=1)

