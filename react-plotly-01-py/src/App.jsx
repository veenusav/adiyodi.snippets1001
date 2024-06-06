import './App.css'
import Plot from 'react-plotly.js';

function App() {
  return (
    <>
      <Plot
        data={[
          {
            type: "heatmap",
            colorbar: { title: "power(dB)" },
            colorscale: "Jet",
            hoverinfo: "x+y+z",
            x: [-5, 2, 5,3],
            y: [10,10,10,10,10,10,20,20, 12,12,12,12,12,12,12,12, 0,0,0,0,0,0,0,0,],
            z: [1000, 400, 0],
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
