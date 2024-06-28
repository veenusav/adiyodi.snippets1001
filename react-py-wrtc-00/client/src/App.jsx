import React, { useEffect, useState } from 'react';
const websocketurl = 'ws://localhost:8080'
function App() {
  const [connected, setConnected] = useState(false);
  const [frameRate, setFrameRate] = useState(0);
  const [latency, setLatency] = useState(0);
  const [frameSize, setFrameSize] = useState(0);

  const [data, setData] = useState({ x: [], y: [], z: [] });
  
  const [payloadSize, setPayloadSize] = useState(0);

  useEffect(() => {
    
    const pc = new RTCPeerConnection();
    console.log("Created RTCPeerConnection.")
    console.log("About to create websocket: ",websocketurl)
    const ws = new WebSocket(websocketurl);

    const start = async () => {
      const offer = await pc.createOffer();
      console.log("pc.createOffer done.")
      await pc.setLocalDescription(offer);
      console.log("pc.setLocalDescription done.")
      ws.onopen = () => {
        pc.onicecandidate = ({ candidate }) => {
          console.log("pc.onicecandidate() initiated.");
          if (candidate) {
            console.log("candidate=",candidate);
            ws.send(JSON.stringify({
              type: 'candidate',
              id: candidate.sdpMid,
              label: candidate.sdpMLineIndex,
              candidate: candidate.candidate
            }));
          }
        };        
        console.log("sending offer through websocket: ", websocketurl)
        console.log("offer: ", offer)
        const offerData = { sdp: offer.sdp.replace(/\r?\n/g, '\n'), type: offer.type };
        console.log("offerData to send: ", offerData)
        ws.send(JSON.stringify(offerData));        
        // ws.send(JSON.stringify(offer));   
      };

      ws.onmessage = async (event) => {
        console.log("received data through websocket: ", websocketurl)
        const data = JSON.parse(event.data);
        console.log("data: ", data);                
        if (data.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data))
          .then(() => {
            console.log("Success: Connection established. After the offer-answer handshaking.");
            setConnected(true);
          })
          .catch(error => {
            console.error("Error setting remote description:", error);
            // Handle the error, e.g., display an error message to the user
          });
          
        } else if (data.type === 'candidate') {
          const candidate = new RTCIceCandidate({
            sdpMLineIndex: data.label,
            candidate: data.candidate
          });
          await pc.addIceCandidate(candidate);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed : ", websocketurl);
        setConnected(false);
      };
      console.log("calling pc.createDataChannel(\"dataChannel\")");
      const channel = pc.createDataChannel("dataChannel");
      let firstTime=true;
      channel.onmessage = (event) => {
        const newData = JSON.parse(event.data);
        if(firstTime) {
          console.log('1st data:', newData);
          firstTime=false;
        }

        // Calculate latency
        const currentTimestamp = new Date().getTime();
        const messageTimestamp = newData.timestamp;
        setLatency(currentTimestamp - messageTimestamp);

        // Update frame rate
        setFrameRate(prevRate => prevRate + 1);

        // Calculate payload size
        setFrameSize(event.data.length);
      };

      setInterval(() => {
        setFrameRate(0);
      }, 1000);
    };

    start();

    return () => {
      pc.close();
    };
  }, []);


  return (
    <div>
      <h1>react-py-wrtc-00</h1>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
      <h3>Latency: {latency} ms</h3>
      <p>Frame Rate: {frameRate} frames/sec</p>      
      <h3>Payload Size: {payloadSize} bytes</h3>      
      <h2>Frame:</h2>
      <p>X: {data.x.join(', ')}</p>
      <p>Y: {data.y.join(', ')}</p>
      <p>Z: {data.z.join(', ')}</p>
    </div>
  );
}

export default App;


// import React, { useEffect, useState } from 'react';

// function App() {
//   const [data, setData] = useState({ x: [], y: [], z: [] });
//   const [latency, setLatency] = useState(0);
//   const [payloadSize, setPayloadSize] = useState(0);
//   const [ws, setWs] = useState(null);

//   useEffect(() => {
//     const socket = new WebSocket('ws://localhost:8765');
//     setWs(socket);

//     socket.onopen = () => {
//       console.log('Connected to WebSocket server');
//     };

//     socket.onmessage = (event) => {
      
//       const currentTime = Date.now();
//       console.log("currentTime: ", currentTime);
//       const newData = JSON.parse(event.data);
//       // console.log('Received data:', newData);
//       setData(newData);

//       // Calculate latency
//       const sendTime = newData.timestamp;
//       const currentLatency = currentTime - sendTime;
//       setLatency(currentLatency);

//       // Calculate payload size
//       setPayloadSize(new TextEncoder().encode(event.data).length);
//     };

//     socket.onclose = () => {
//       console.log('Disconnected from WebSocket server');
//     };

//     socket.onerror = (error) => {
//       console.log('WebSocket error:', error);
//     };

//     // Clean up on component unmount
//     return () => {
//       socket.close();
//     };
//   }, []);

//   return (
//     <div>
//       <h1>react-py-wrtc-00</h1>
//       <h2>Frame:</h2>
//       <p>X: {data.x.join(', ')}</p>
//       <p>Y: {data.y.join(', ')}</p>
//       <p>Z: {data.z.join(', ')}</p>
//       <h3>Latency: {latency} ms</h3>
//       <h3>Payload Size: {payloadSize} bytes</h3>
//     </div>
//   );
// }

// export default App;


