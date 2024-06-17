import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState({ x: [], y: [], z: [] });
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8765');
    setWs(socket);

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      console.log('Received data:', newData);
      setData(newData);
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
      <h1>Data Sample</h1>
      <p>X: {data.x.join(', ')}</p>
      <p>Y: {data.y.join(', ')}</p>
      <p>Z: {data.z.join(', ')}</p>
    </div>
  );
}

export default App;


