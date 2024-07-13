const DATA_PRODUCTION_FPS = 33;
const FRAME_SIZE_IN_KB = 150;
const NO_OF_FRAMES = 700;
const DISPLAY_SLICE = 5; // ensure enough numbers in the frame. DISPLAY_SLICE * sizeof(number) < FRAME_SIZE_IN_KB*1024
import React, { useState, useEffect, useRef } from 'react';
import sizeof from 'object-sizeof';

const SIZE_OF_DATOM = sizeof(Math.floor(Math.random() * 65536));//in bytes
console.log("datom size: ", SIZE_OF_DATOM);
const NO_ELEMENTS_FOR_FRAME = (FRAME_SIZE_IN_KB*1024)/SIZE_OF_DATOM;

function populateFrameData(n) {
  const frame = [];
  for (let i = 0; i < n; i++) {
    // Generate a random integer between 0 (inclusive) and 65535 (inclusive)
    const randomNumber = Math.floor(Math.random() * 65536);
    frame.push(randomNumber);
  }
  return frame;
}

function populateFramesData(numberOfFrames, elementsCountForEachFrame) {
  // Check for invalid input (n should be a positive integer)
  if (numberOfFrames <= 0 || !Number.isInteger(numberOfFrames)) {
    throw new Error('Invalid input: numberOfFrames must be a positive integer');
  }
  // Check for invalid input (n should be a positive integer)
  if (elementsCountForEachFrame <= 0 || !Number.isInteger(elementsCountForEachFrame)) {
    throw new Error('Invalid input: elementsCountForEachFrame must be a positive integer');
  }
  const frames = [];
  for (let i = 0; i < numberOfFrames; i++) {
    const frame=populateFrameData(elementsCountForEachFrame);
    frames.push(frame);
  }
  return frames;
}

const FRAMES = populateFramesData(NO_OF_FRAMES,NO_ELEMENTS_FOR_FRAME);

//--- initialization done

console.log("DATA_PRODUCTION_FPS: ",DATA_PRODUCTION_FPS);
const DATA_PUBLISH_INTERVAL = 1000/DATA_PRODUCTION_FPS; // milliseconds
console.log("DATA_PUBLISH_INTERVAL: ", DATA_PUBLISH_INTERVAL," ms");
const f0Len = FRAMES[0].length;
const f00Bytes = sizeof(FRAMES[0][0]);
console.log("dataframe[0][0] has a memory footprint of ", f00Bytes," bytes");
const f0Bytes = f00Bytes*f0Len; // when if call sizeof(FRAMES[0]) it is giving a lesser figure which i cannot trust. for example for 100 elements 573bytes instead of 800 bytes!
console.log("dataframe[0] has ",f0Len," elements. Has a memory footprint of ", f0Bytes," bytes (",f0Bytes/1024,"KB)." );

//--- initial logs done

function App() {
  const [frameCount, setFrameCount] = useState(0);
  const [frameData, setFrameData] = useState([]);
  const [fps, setFps] = useState(0);
  const [averageFps, setAverageFps] = useState(0);
  const [averageFrameBytes, setAverageFrameBytes] = useState(0);
  const previousTimeRef = useRef(performance.now());

  useEffect(() => {
    const handleFrameChange = () => {
      const now = performance.now();
      const elapsedTime = now - previousTimeRef.current;

      // Update FPS
      const currentFps = Math.round(1000 / elapsedTime);

      // Update average FPS
      const newAverageFps = (averageFps * frameCount + currentFps) / (frameCount + 1);

      // Update frame data (loop through frames)
      const frameIndex = frameCount % FRAMES.length;
      const frame=FRAMES[frameIndex];

      const frameBytes = (sizeof(frame[0])*frame.length)/1024; //KB | sizeof(frame) is giving a lower value. need to find reason!
      const newAverageFrameBytes = (averageFrameBytes * frameCount + frameBytes) / (frameCount + 1);

      previousTimeRef.current = now;     
      setFps(currentFps);
      setAverageFps(newAverageFps);
      setAverageFrameBytes(newAverageFrameBytes);
      
      setFrameData(frame.slice(0, DISPLAY_SLICE)); // Show only a few numbers
      setFrameCount(frameCount + 1); // Increment frame count
    };

    const intervalId = setInterval(handleFrameChange, DATA_PUBLISH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [frameCount]);

  return (
    <div className="App">
      <h3>00-display</h3>
      <h1>Frame Viewer</h1>
      <h2>Frame: {frameCount}</h2>
      <h2>Data production FPS: {DATA_PRODUCTION_FPS}</h2>
      <h2>Current         FPS: {fps}</h2>
      <h2>Average         FPS: {averageFps.toFixed(2)}</h2>
      <h2>Average Frame size:  {averageFrameBytes.toFixed(2)} KB </h2>
      <pre>{frameData.join(' ')}</pre>
    </div>
  );
}

export default App;
