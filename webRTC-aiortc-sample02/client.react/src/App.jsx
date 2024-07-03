import React, { useEffect, useRef } from 'react';
console.log(".vav | BEGIN");
const App = () => {
  const videoRef = useRef(null);
  const websocket = useRef(null);
  let pc = null;

  useEffect(() => {
    const startWebsocket = async () => {
      console.log(".vav | startWebsocket(). begin ");
      console.log(".vav | startWebsocket(). before Websocket start.");
      websocket.current = new WebSocket('ws://localhost:8080');

      websocket.current.onopen = () => {
        console.log(".vav | websocket.current.onopen()");
        startWebRTC();
      };

      websocket.current.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log(".vav | websocket.current.onmessage(). event.data: ", event.data);
        console.log(".");console.log(".");
        if (message.type === 'answer') {
          await handleAnswer(message);
        } else if (message.type === 'candidate') {
          await handleCandidate(message);
        }
      };

      websocket.current.onclose = () => {
        console.log(".vav | websocket.current.onclose()");
      };
      console.log(".vav | startWebsocket(). end ");
    };

    startWebsocket();

    return () => {
      if (websocket.current) {
        console.log(".vav |  return () routine. about to call websocket.current.close() ");
        websocket.current.close();
      }
      if (pc) {
        console.log(".vav |  return () routine. about to call pc.close() ");
        pc.close();
      }
    };
  }, []);

  const startWebRTC = async () => {
    console.log(".vav | startWebRTC(). begin ");
    var config = {
      sdpSemantics: 'unified-plan',
      // iceServers: [], // Use empty iceServers array to avoid reliance on external STUN/TURN servers
      // iceServers: [{ urls: "stun:localhost:3478" }] ,
      // iceTransportPolicy: 'all'  // Ensure we attempt to use all network paths (even though ICE servers list is empty)
    };
    pc = new RTCPeerConnection(config);

    // pc = new RTCPeerConnection({
    //   iceServers: []
    // });

    // pc = new RTCPeerConnection(); 

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate: ', event.candidate);
      }
    };
    
    pc.ontrack = (event) => {
      console.log(".vav | pc.ontrack()");
      if (event.track.kind === 'video') {
        videoRef.current.srcObject = event.streams[0];
      }
    };
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });
    
    const offer = await pc.createOffer();
    // offer.sdp= offer.sdp+"m=video 9 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\n"
    console.log(".vav | pc.setLocalDescription(offer) about to call. offer : ",offer);
    console.log(".");console.log(".");
    await pc.setLocalDescription(offer);
    
    websocket.current.send(JSON.stringify({
      type: 'offer',
      sdp: pc.localDescription.sdp,
    }));
    console.log(".vav | startWebRTC(). end ");
  };

  const handleAnswer = async (message) => {
    console.log(".vav | handleAnswer(). message : ", message);
    const answer = new RTCSessionDescription({
      type: 'answer',
      sdp: message.sdp,
    });

    await pc.setRemoteDescription(answer);
  };

  const handleCandidate = async (message) => {
    console.log(".vav | handleCandidate(). message : ", message);
    const candidate = new RTCIceCandidate(message.candidate);
    await pc.addIceCandidate(candidate);
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline controls />
    </div>
  );
};

export default App;

console.log(".vav | END");