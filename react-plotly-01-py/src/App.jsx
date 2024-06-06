import './App.css'
import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState({ x: [], y: [], z: [] });
  useEffect(() => {
    //note: this url is configured in vite.config.js for a redirection
    //  Redirection to the python server which runs on a different port.
    // This is to avoid CORS issues. otherwise we could give full url with port here itself.
    fetch('/api/data') 
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);
  
  return (
    <>
      <Plot
        data={[
          {
            type: "heatmap",
            colorbar: { title: "power(dB)" },
            colorscale: "Jet",
            hoverinfo: "x+y+z",
            x: data.x,
            y: data.y,
            z: data.z,
          },
        ]}
        layout={
          {
            title: 'Floor heatmap',
            width: 320,
            height: 695 - 45,
            plot_bgcolor: "black",
            paper_bgcolor: "#FF3",
            xaxis: {
              title: "velocity(m/s)",
              range: [-10 / 2, 10 / 2],
              // autorange:true,
            },
            yaxis: {
              title: "range(m)",
              range: [0, 20],
              // autorange:true,
            },
            annotations: [],
          }
        }
      />
    </>
  )
}
export default App
