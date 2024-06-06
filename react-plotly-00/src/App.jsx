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
            title: 'conceptual heatmap',
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

//---- scaffolding code by vite

// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vitejs.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
