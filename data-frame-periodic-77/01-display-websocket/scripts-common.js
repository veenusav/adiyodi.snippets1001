const DATA_SERVER_PORT = 8183;
const DATA_REQUEST_CODE = 'START-STREAMING';
const DISPLAY_SLICE = 100; //characters // ensure enough numbers in the frame. DISPLAY_SLICE * sizeof(number) < FRAME_SIZE_IN_KB*1024
const AVG_FPS_UI_UPDATE_INERVAL = 2000; //in milliseconds.
const SIZE_OF_CHARACTER = 2; // in bytes

const USER_PREFIX = "USER-";

//===  utility functions
enableUI = (id) => {
    const e = document.getElementById(id);
    if (e === null)
        return false;
    e.disabled = false;
    return true;
}
disableUI = (id) => {
    const e = document.getElementById(id);
    if (e === null)
        return false;
    e.disabled = true;
    return true;
}
let socket;
initConsumer = () => {
    console.log("initConsumer called.");
    // return;
    const userName = USER_PREFIX + Math.floor(Math.random() * 100000);
    initUI = () => {
        document.getElementById('user-name').innerHTML = userName;
        disableUI("hangup");
        enableUI("call");
        document.getElementById("average_fps").innerHTML = "--.--";
        document.getElementById("current_fps").innerHTML = "-";
    };
    initUI();
    //==================================================
    //Master logic:
    //When call() will be triggered when the user asks for it.
    //When the server accepts our connection, it will send frames periodically.
    //At anypoint, hangup() can be called.
    //data will be displayed on the screen.

    //Executed to initiate the server connection
    const call = async e => {
        console.log("call requested.");
        let firstFrame = true;
        const ws = new WebSocket(`ws://localhost:${DATA_SERVER_PORT}`);
        ws.onopen = () => { // Handle connection established event
            console.log('WebSocket connection opened. requesting data stream.');
            ws.send(DATA_REQUEST_CODE);
        };
        //-- init states and buttons/controls
        enableUI("hangup");
        disableUI("call");

        // hangup()
        // will be called when I am dropping from the conection.. 
        const hangup = async e => {
            console.log("hanging up data transmission activities... ")
            ws.close();
            initUI();
        }
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            hangup();
        };
        ws.onclose = () => {
            console.log('WebSocket connection closed.');
            hangup();
        };
        document.getElementById('hangup').addEventListener('click', hangup);

        let frameCount = 0;
        let firstFrameTimestamp = performance.now();
        let lastFrameTimestamp = performance.now();
        let averageFps = 0;
        let AVGUIUpdatedTimestamp = performance.now();
        initFPSCalculation = () => {
            //initing all counters for FPS calc. connection is a fresh start
            console.log("Resetting FPS calculation... ")
            frameCount = 0;
            const now = performance.now();
            firstFrameTimestamp = now;
            lastFrameTimestamp = now;
            averageFps = 0;
            AVGUIUpdatedTimestamp = now;
            // console.log("averageFps, frameCount+1, firstFrameTimestamp,now, (now - firstFrameTimestamp), (now - firstFrameTimestamp)/(frameCount + 1)");
            // console.log(averageFps, frameCount + 1, firstFrameTimestamp, now, (now - firstFrameTimestamp), (now - firstFrameTimestamp) / (frameCount + 1));
        };

        let totLatency = 0; // in milliseconds
        //Frame arrived! 
        ws.onmessage = (event) => {
            if (firstFrame) {
                firstFrame = false;
                console.log("TS :", event.timeStamp, " (sender first frame)");
                totLatency = 0;
                initFPSCalculation();
            }
            totLatency += performance.now() - event.timeStamp;
            if (frameCount % 200 == 0) {
                let avgLatency = totLatency / (frameCount + 1);

                // Calculate and log one-way latency using performance.now()
                const receiveTime = performance.now(); // Get high-resolution timestamp

                // If the server doesn't include a timestamp in the data frame:
                // - Adapt the calculation based on your server's implementation
                // - You might need to estimate an ideal sending time on the client-side

                console.log(`${frameCount} : AVG latency = ${avgLatency} ms`);
            }

            dataFrame = event.data;

            //-- fps calculation
            const now = performance.now();
            const elapsedTime = now - lastFrameTimestamp;

            // Update FPS
            const currentFps = Math.round(1000 / elapsedTime);

            // Update average FPS
            //averageFps = (averageFps * frameCount + currentFps) / (frameCount + 1);
            averageFps = 1000 / ((now - firstFrameTimestamp) / (frameCount + 1));
            // if (frameCount % 400 === 0) {
            //     console.log(averageFps, ", ", frameCount + 1, ", ", firstFrameTimestamp, ", ", now, ", ", (now - firstFrameTimestamp), ", ", (now - firstFrameTimestamp) / (frameCount + 1));
            // }
            document.getElementById("current_fps").innerHTML = currentFps;
            if (now - AVGUIUpdatedTimestamp > AVG_FPS_UI_UPDATE_INERVAL) {
                document.getElementById("average_fps").innerHTML = averageFps.toFixed(2);// Math.round(averageFps);
                AVGUIUpdatedTimestamp = now;
            }
            lastFrameTimestamp = now;
            document.getElementById("current_frame_size").innerHTML = (dataFrame.size / 1024).toFixed(4) + "kb";

            document.getElementById("frameCount").innerHTML = frameCount;
            document.getElementById("dataFrame").innerHTML = dataFrame.slice(0, DISPLAY_SLICE);
            frameCount++;
        };

    }
    //--hooks on UI
    document.getElementById('call').addEventListener('click', call);

}
