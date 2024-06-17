import React, { useEffect, useState } from 'react';

function DataDisplay() {
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
      <h1>Data</h1>
      <p>X: {data.x.join(', ')}</p>
      <p>Y: {data.y.join(', ')}</p>
      <p>Z: {data.z.join(', ')}</p>
    </div>
  );
}

export default DataDisplay;


// import React, { useEffect, useState } from 'react';
// import io from 'socket.io-client';

// const socket = io('http://localhost:5000');

// function DataDisplay() {
//   const [data, setData] = useState({ x: [], y: [], z: [] });

//   useEffect(() => {
//     socket.on('connect', () => {
//       console.log('Connected to WebSocket server');
//     });

//     socket.on('data', (newData) => {
//       console.log('Received data:', newData);
//       //setData(newData);
//     });

//     socket.on('disconnect', () => {
//       console.log('Disconnected from WebSocket server');
//     });

//     // Clean up on component unmount
//     return () => {
//       socket.off('data');
//     };
//   }, []);

//   return (
//     <div>
//       <h1>Data</h1>
//       <p>X: {data.x.join(', ')}</p>
//       <p>Y: {data.y.join(', ')}</p>
//       <p>Z: {data.z.join(', ')}</p>
//     </div>
//   );
// }

// export default DataDisplay;


// import './App.css'
// import Plot from 'react-plotly.js';
// import React, { useEffect, useState } from 'react';
// import io from 'socket.io-client';

// // const socket = io('http://localhost:5000');


// const socket = io('http://localhost:5000', {
//   transports: ['websocket'],
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000,
//   timeout: 20000, // 20 seconds timeout
//   autoConnect: true,
//   withCredentials: false,
// });

// socket.on('connect', () => {
//   console.log('Connected to server');
// });

// socket.on('connect_error', (err) => {
//   console.error('Connection error:', err);
// });

// // socket.on('ABCD', (data) => {
// //     console.log('Received dataa:', data);
// // });

// socket.on('disconnect', () => {
//   console.log('Disconnected from server');
// });


// function App() {
//   const [data, setData] = useState({ x: [], y: [], z: [] });

//   useEffect(() => {
//     socket.on('data', (newData) => {
//       console.log('Received data:', newData);
//       setData(newData);
//     });
//     return () => {
//       // socket.off('data');
//     };
//   }, []);

//   // useEffect(() => {
//   //   // Clean up on unmount
//   //   return () => {
//   //     socket.disconnect();
//   //   };
//   // }, []);

//   return (
//     <>
//       <Plot
//         data={[
//           {
//             type: "heatmap",
//             colorbar: { title: "power(dB)" },
//             colorscale: "Jet",
//             hoverinfo: "x+y+z",
//             x: data.x,
//             y: data.y,
//             z: data.z,
//           },
//         ]}
//         layout={
//           {
//             title: 'Floor heatmap',
//             width: 320,
//             height: 650,
//             plot_bgcolor: "black",
//             paper_bgcolor: "#FF3",
//             xaxis: {
//               title: "velocity(m/s)",
//               range: [-10 / 2, 10 / 2],
//             },
//             yaxis: {
//               title: "range(m)",
//               range: [0, 20],
//             },
//             annotations: [],
//           }
//         }
//       />
//     </>
//   );
// }

// export default App;
