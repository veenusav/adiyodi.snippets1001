
// Instructions to run with one computer.
// run at command prompt: node server.js
// at the browser : https://localhost:8182/
const DATA_PRODUCTION_FPS = 1;
const FRAME_SIZE_IN_KB = 150;
const NO_OF_FRAMES = 2;
const DISPLAY_SLICE = 100; //characters // ensure enough numbers in the frame. DISPLAY_SLICE * sizeof(number) < FRAME_SIZE_IN_KB*1024
const AVG_FPS_UI_UPDATE_INERVAL = 2000; //in milliseconds.

const SIZE_OF_CHARACTER = 2; // in bytes

const DATA_PUBLISH_INTERVAL = 1000 / DATA_PRODUCTION_FPS; // milliseconds


const WEB_SERVER_PORT = 8182;
const USER_PWD = "x"; // Caution: This is also used in server for validation.

const fs = require('fs');
const https = require('https')
const express = require('express');
const app = express();
const socketio = require('socket.io');
const { connect } = require('http2');
const { toUnicode } = require('punycode');
app.use(express.static(__dirname))

//we need a key and cert to run https
//we generated them with mkcert
// $ mkcert create-ca
// $ mkcert create-cert
const key = fs.readFileSync('cert.key');
const cert = fs.readFileSync('cert.crt');

//we changed our express setup so we can use https
//pass the key and cert to createServer on https
const expressServer = https.createServer({ key, cert }, app);
//create our socket.io server... it will listen to our express port
const io = socketio(expressServer, {
    cors: {
        origin: [
            "https://localhost",
            // 'https://LOCAL-DEV-IP-HERE' //if using a phone or another computer
        ],
        methods: ["GET", "POST"]
    }
});
console.log("Starting webserver at port ", WEB_SERVER_PORT)
expressServer.listen(WEB_SERVER_PORT);


let connectedSockets = [
    //username, socketId
]
printServerStatus = () => {
    console.log("== Server Status ==")
    console.log("Clients:");
    console.log(connectedSockets);
};

io.on('connection', (socket) => {
    
    const userName = socket.handshake.auth.userName;
    const password = socket.handshake.auth.password;
    if (password !== USER_PWD) {
        console.warn("Client ",userName," can't authorize self with the server. socket id:", socket.id);
        socket.disconnect(true);
        return;
    }
    console.log("Client ",userName," connected with the server. socket id:", socket.id);
    sendText_nothing = (message) => {
        //dummyFunction
    }
    let frameCount=0;
    socketio_sendText = (message) => {
        // socket.to(socket.id).emit('groove', message);
        socket.broadcast.emit('groove', message);
        frameCount++;
        if(frameCount%10)
            console.log("/");
    }
    sendText = socketio_sendText; 
    connectedSockets.push({
        socketId: socket.id,
        userName
    });

    removeClient = (user) => {
        const filtered = connectedSockets.filter(item => item.userName !== user);
        connectedSockets = filtered;
    };

    socket.on('disconnect', function () {
        console.warn("socket connection got interruped.",
            "Removing records of the client: ", userName);
        sendText = sendText_nothing; // default value 
        removeClient(userName);
        console.log(userName, " exited. ## ");
        printServerStatus();
    });
    //a new client has joined! 
    printServerStatus();
    console.log("started to send frames...");
    let timerId = setInterval(  () => {
            if(sendText === sendText_nothing) 
                stopProduction();
            dataFrame ="ABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCD ABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCDABCD ABCD";
            sendText(dataFrame);

        }, DATA_PUBLISH_INTERVAL);
    
    function stopProduction() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
        console.log("Client ",userName," disconnected from the server. socket id used:", socket.id);
      }
    }
    
})
