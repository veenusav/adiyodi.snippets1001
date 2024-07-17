const DATA_PRODUCTION_FPS = 60;
const FRAME_SIZE_IN_KB = 150;
const NO_OF_FRAMES = 2;
const DISPLAY_SLICE = 100; //characters // ensure enough numbers in the frame. DISPLAY_SLICE * sizeof(number) < FRAME_SIZE_IN_KB*1024
const AVG_FPS_UI_UPDATE_INERVAL = 2000; //in milliseconds.

const SIZE_OF_CHARACTER = 2; // in bytes

const DATA_PUBLISH_INTERVAL = 1000 / DATA_PRODUCTION_FPS; // milliseconds

//Signal server related configuration
const WEB_SERVER_URL = 'https://localhost:8182/'; // Caution: Obviously! it is used in server as well!
//const WEB_SERVER_URL = 'https://LOCAL-DEV-IP-HERE:8181/'; //if trying it on a phone, use this instead...

const USER_PWD = "x"; // Caution: This is also used in server for validation.
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
    const password = USER_PWD;
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

        socket = io.connect(WEB_SERVER_URL, {
            auth: {
                userName, password
            }
        });
        //-- init states and buttons/controls
        enableUI("hangup");
        disableUI("call");

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            //  Handle the error here (e.g., display an error message to the user)
            socket.disconnect();
            initUI();
        });
        // hangup()
        // will be called when I am dropping from the conection.. offers will be ended and 
        // the WebRTCconnection as well.
        const hangup = async e => {
            console.log("hanging up data transmission activities... ")
            socket.disconnect();
            initUI();
        }
        document.getElementById('hangup').addEventListener('click', hangup);



        //--hook on internal states

        let frameCount = 0;
        let firstFrameTimestamp = performance.now();
        let lastFrameTimestamp = performance.now();
        let averageFps = 0;
        let AVGUIUpdatedTimestamp = performance.now();
        {
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
        }
        socket.on('availableOffers', offers => {

            // console.log(offers)
            if (onGettingOffers != undefined)
                onGettingOffers(offers);
        })
        //Frame arrived!     
        socket.on('groove', dataFrame => {
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
            document.getElementById("current_frame_size").innerHTML = (dataFrame.length / 1024).toFixed(4) + "kb";

            document.getElementById("frameCount").innerHTML = frameCount;
            document.getElementById("dataFrame").innerHTML = dataFrame.slice(0, DISPLAY_SLICE);
            frameCount++;
        });
    }
    //--hooks on UI
    document.getElementById('call').addEventListener('click', call);

}
