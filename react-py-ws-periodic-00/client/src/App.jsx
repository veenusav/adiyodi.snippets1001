import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState({ x: [], y: [], z: [] });
  const [latency, setLatency] = useState(0);
  const [payloadSize, setPayloadSize] = useState(0);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8765');
    setWs(socket);

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      
      const currentTime = Date.now();
      console.log("currentTime: ", currentTime);
      const newData = JSON.parse(event.data);
      // console.log('Received data:', newData);
      setData(newData);

      // Calculate latency
      const sendTime = newData.timestamp;
      const currentLatency = currentTime - sendTime;
      setLatency(currentLatency);

      // Calculate payload size
      setPayloadSize(new TextEncoder().encode(event.data).length);
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    socket.onerror = (error) => {
      console.log('WebSocket error:', error);
    };

    // Clean up on component unmount
    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <h1>react-py-ws-periodic-00</h1>
      <h2>Data:</h2>
      <p>X: {data.x.join(', ')}</p>
      <p>Y: {data.y.join(', ')}</p>
      <p>Z: {data.z.join(', ')}</p>
      <h3>Latency: {latency} ms</h3>
      <h3>Payload Size: {payloadSize} bytes</h3>
    </div>
  );
}

export default App;


