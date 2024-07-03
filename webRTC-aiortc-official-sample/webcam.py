import argparse
import asyncio
import json
import logging
import os
import platform
import ssl

from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay
from aiortc.rtcrtpsender import RTCRtpSender
from aiortc.contrib.media import MediaStreamTrack

ROOT = os.path.dirname(__file__)


relay = None
webcam = None


def create_local_tracks(play_from, decode):
    global relay, webcam

    if play_from:
        player = MediaPlayer(play_from, decode=decode)
        return player.audio, player.video
    else:
        options = {"framerate": "30", "video_size": "640x480"}
        if relay is None:
            if platform.system() == "Darwin":
                webcam = MediaPlayer(
                    "default:none", format="avfoundation", options=options
                )
            elif platform.system() == "Windows":
                webcam = MediaPlayer(
                    "video=Integrated Camera", format="dshow", options=options
                    # "video=DSHOW", format="dshow", options=options
                    
                )
                # webcam = VideoTrack(camera_index=0)
                # return None, MediaRelay().subscribe(webcam)
            else:
                webcam = MediaPlayer("/dev/video0", format="v4l2", options=options)
            relay = MediaRelay()
        return None, relay.subscribe(webcam.video)


def force_codec(pc, sender, forced_codec):
    kind = forced_codec.split("/")[0]
    codecs = RTCRtpSender.getCapabilities(kind).codecs
    transceiver = next(t for t in pc.getTransceivers() if t.sender == sender)
    transceiver.setCodecPreferences(
        [codec for codec in codecs if codec.mimeType == forced_codec]
    )


async def index(request):
    content = open(os.path.join(ROOT, "index.html"), "r").read()
    return web.Response(content_type="text/html", text=content)


async def javascript(request):
    content = open(os.path.join(ROOT, "client.js"), "r").read()
    return web.Response(content_type="application/javascript", text=content)


async def offer(request):
    print("offer() start")
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on('icecandidate')
    async def on_icecandidate(candidate):
        print("on_icecandidate ")            
        if candidate:
            print("candidate : ", candidate)            
            # await websocket.send(json.dumps({'candidate': candidate.to_dict()}))
            # note: there is no websocket in this logic. but it will be good 
            # to share this icecandidate with my peer. for example through websocket, 
            # http or signaling server.

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print("Connection state is %s" % pc.connectionState)
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    # open media source
    audio, video = create_local_tracks(
        args.play_from, decode=not args.play_without_decoding
    )

    if audio:
        audio_sender = pc.addTrack(audio)
        if args.audio_codec:
            force_codec(pc, audio_sender, args.audio_codec)
        elif args.play_without_decoding:
            raise Exception("You must specify the audio codec using --audio-codec")

    if video:
        video_sender = pc.addTrack(video)
        if args.video_codec:
            force_codec(pc, video_sender, args.video_codec)
        elif args.play_without_decoding:
            raise Exception("You must specify the video codec using --video-codec")

    await pc.setRemoteDescription(offer)

    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    # sample sdp 'v=0\r\no=- 3928566205 3928566205 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=msid-semantic:WMS *\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97 102 103 106 107\r\nc=IN IP4 0.0.0.0\r\na=sendonly\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=mid:0\r\na=msid:4365b412-e9d2-4660-9eb6-e158bf9cd30c 5e9bb7fd-cd0b-43f9-95e8-1cbe6c9ae49b\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=rtcp-mux\r\na=ssrc-group:FID 634600354 1443695087\r\na=ssrc:634600354 cname:3a3f8775-b682-47b7-877c-cf40bebe979f\r\na=ssrc:1443695087 cname:3a3f8775-b682-47b7-877c-cf40bebe979f\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtcp-fb:96 goog-remb\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:102 H264/90000\r\na=rtcp-fb:102 nack\r\na=rtcp-fb:102 nack pli\r\na=rtcp-fb:102 goog-remb\r\na=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtpmap:103 rtx/90000\r\na=fmtp:103 apt=102\r\na=rtpmap:106 H264/90000\r\na=rtcp-fb:106 nack\r\na=rtcp-fb:106 nack pli\r\na=rtcp-fb:106 goog-remb\r\na=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:107 rtx/90000\r\na=fmtp:107 apt=106\r\na=ice-ufrag:AN8m\r\na=ice-pwd:OgDeCaZYtTkupuNo37Sur2\r\na=fingerprint:sha-256 CB:C3:DB:8D:64:50:4C:14:95:BC:76:1B:4C:62:C4:AE:28:F8:7B:B3:CE:39:29:CE:5D:4F:50:F6:54:9E:0F:7F\r\na=setup:active\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 0 8\r\nc=IN IP4 0.0.0.0\r\na=sendonly\r\na=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=mid:1\r\na=msid:4365b412-e9d2-4660-9eb6-e158bf9cd30c 2e50c994-ffef-403c-95c8-8eccb9a4055f\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=rtcp-mux\r\na=ssrc:3284669967 cname:3a3f8775-b682-47b7-877c-cf40bebe979f\r\na=rtpmap:111 opus/48000/2\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=ice-ufrag:AN8m\r\na=ice-pwd:OgDeCaZYtTkupuNo37Sur2\r\na=fingerprint:sha-256 CB:C3:DB:8D:64:50:4C:14:95:BC:76:1B:4C:62:C4:AE:28:F8:7B:B3:CE:39:29:CE:5D:4F:50:F6:54:9E:0F:7F\r\na=setup:active\r\n'
    return web.Response(
        content_type="application/json",
        text=json.dumps(
            {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        ),
    )


pcs = set()


async def on_shutdown(app):
    # close peer connections
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebRTC webcam demo")
    parser.add_argument("--cert-file", help="SSL certificate file (for HTTPS)")
    parser.add_argument("--key-file", help="SSL key file (for HTTPS)")
    parser.add_argument("--play-from", help="Read the media from a file and sent it.")
    parser.add_argument(
        "--play-without-decoding",
        help=(
            "Read the media without decoding it (experimental). "
            "For now it only works with an MPEGTS container with only H.264 video."
        ),
        action="store_true",
    )
    parser.add_argument(
        "--host", default="0.0.0.0", help="Host for HTTP server (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port", type=int, default=8080, help="Port for HTTP server (default: 8080)"
    )
    parser.add_argument("--verbose", "-v", action="count")
    parser.add_argument(
        "--audio-codec", help="Force a specific audio codec (e.g. audio/opus)"
    )
    parser.add_argument(
        "--video-codec", help="Force a specific video codec (e.g. video/H264)"
    )

    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    if args.cert_file:
        ssl_context = ssl.SSLContext()
        ssl_context.load_cert_chain(args.cert_file, args.key_file)
    else:
        ssl_context = None

    app = web.Application()
    app.on_shutdown.append(on_shutdown)
    app.router.add_get("/", index)
    app.router.add_get("/client.js", javascript)
    app.router.add_post("/offer", offer)
    web.run_app(app, host=args.host, port=args.port, ssl_context=ssl_context)
