const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const WEB_SERVER_PORT = 8182;
const DATA_SERVER_PORT = 8183;

const DATA_PRODUCTION_FPS = 35;
const FRAME_SIZE_IN_KB = 150;
const NO_OF_FRAMES = 10;

const DATA_PUBLISH_INTERVAL = 1000 / DATA_PRODUCTION_FPS; // milliseconds

let frames = [];
let frameIndex = 0;
let isStreaming = false;

const crypto = require('crypto'); // Import crypto module
function generateRandomFrame() {
    const randomBytes = new Uint8Array(FRAME_SIZE_IN_KB * 1024); // 1 KB is 1024 bytes
    crypto.randomFillSync(randomBytes); // Use crypto.randomFillSync for random data generation
    return Buffer.from(randomBytes);
}


function prepareFrames() {
    for (let i = 0; i < NO_OF_FRAMES; i++) {
        frames.push(generateRandomFrame());
    }
}

const server = http.createServer((req, res) => {
    const filePath = req.url === '/' ? 'index-consumer.html' : req.url.slice(1);
    const contentType = filePath.endsWith('.html') ? 'text/html' : filePath.endsWith('.css') ? 'text/css' : 'text/javascript';
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.statusCode = 404;
            res.end('Not Found');
        } else {
            res.setHeader('Content-Type', contentType);
            res.end(data);
        }
    });
});

const wss = new WebSocket.Server({ port: DATA_SERVER_PORT });
console.log("data socket server created at port ",DATA_SERVER_PORT );
wss.on('connection', (ws) => {
    console.log("data socket server connected at port ",DATA_SERVER_PORT );
    ws.on('message', (messageData) => {
        let message = messageData.toString();
        if (message === 'START-STREAMING') {
            console.log("client requested to stream.");
            isStreaming = true;
            frameIndex = 0;
            const intervalId = setInterval(() => {
                if (isStreaming) {
                    if (frameIndex < frames.length) {
                        ws.send(frames[frameIndex]);
                        frameIndex++;
                    } else {
                        console.log("finished sending all frames.");
                        clearInterval(intervalId);
                        isStreaming = false;
                    }
                }
            }, DATA_PUBLISH_INTERVAL);
        } else {
            console.log("Unknown message in the socket. closing the connection. message: #",message,"#");
            isStreaming = false;
            ws.close(); // Close connection on other messages or client disconnection
        }
    });

    ws.on('close', () => {
        console.log("data socket server closed at port ",DATA_SERVER_PORT );        
        isStreaming = false;
    });
});

prepareFrames(); // Generate frames on server start
server.listen(WEB_SERVER_PORT, () => {
    console.log(`Server listening on port ${WEB_SERVER_PORT}`);
});
