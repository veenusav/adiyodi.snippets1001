
// Instructions to run with one computer.
// run at command prompt: node server.js
// at the browser : https://localhost:8181/

const WEB_SERVER_PORT = 8181;
const USER_PWD = "x"; // Caution: This is also used in server for validation.

const fs = require('fs');
const https = require('https')
const express = require('express');
const app = express();
const socketio = require('socket.io');
const { connect } = require('http2');
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

//offers will contain {}
let offers = [
    // offererUserName
    // offer
    // offerIceCandidates
    // answererUserName
    // answer
    // answererIceCandidates
];
let connectedSockets = [
    //username, socketId
]
printServerStatus = () => {
    console.log("== Server Status ==")
    console.log("Clients:");
    console.log(connectedSockets);
    console.log("Offers:");
    console.log(offers);
};

io.on('connection', (socket) => {
    
    const userName = socket.handshake.auth.userName;
    const password = socket.handshake.auth.password;
    if (password !== USER_PWD) {
        socket.disconnect(true);
        return;
    }
    console.log("Connected to ", userName);
    connectedSockets.push({
        socketId: socket.id,
        userName
    });

    removeClient = (user) => {
        console.log("socket of the user: ", user, " has been removed.");
        console.log("################ connectedSockets() before & after ");
        console.log(connectedSockets);
                
        const filtered = connectedSockets.filter(item => item.userName !== user);
        connectedSockets = filtered;
        console.log("----------------");
        console.log(connectedSockets);
        console.log("################");
    };

    removeOffers = (user) => {
        const filtered = offers.filter(item => item.offererUserName !== user);
        offers = filtered;
        console.log("Offers of the user: ", user, " has been removed.");

    };
    socket.on('disconnect', function () {
        console.warn("socket connection got interruped.",
            "Removing records of the client: ", userName);
        removeOffers(userName);
        removeClient(userName);
        console.log(userName, " exited. ## ");
        printServerStatus();
    });

    //a new client has joined. If there are any offers available,
    //emit them out
    if (offers.length) {
        socket.emit('availableOffers', offers);
        
    }
    printServerStatus();

    socket.on('newOffer', newOffer => {
        offers.push({
            offererUserName: userName,
            offer: newOffer,
            offerIceCandidates: [],
            answererUserName: null,
            answer: null,
            answererIceCandidates: []
        })
        // console.log(newOffer.sdp.slice(50))
        //send out to all connected sockets EXCEPT the caller
        socket.broadcast.emit('newOfferAwaiting', offers.slice(-1))
        printServerStatus();
    });

    socket.on('removeOffer', () => {
        removeOffers(userName);
        //a client offer moved away. inform new list to all clients
        socket.broadcast.emit('availableOffers', offers);
        printServerStatus();
    });

    socket.on('newAnswer', (offerObj, ackFunction) => {
        console.log(offerObj);
        //emit this answer (offerObj) back to CLIENT1
        //in order to do that, we need CLIENT1's socketid
        const socketToAnswer = connectedSockets.find(s => s.userName === offerObj.offererUserName)
        if (!socketToAnswer) {
            console.warn("No matching socket: ", offerObj.offererUserName);
            console.error("Cannot answer. May be old sessions' clients are active with the browsers. Please restart them.")
            return;
        }
        //we found the matching socket, so we can emit to it!
        const socketIdToAnswer = socketToAnswer.socketId;
        //we find the offer to update so we can emit it
        const offerToUpdate = offers.find(o => o.offererUserName === offerObj.offererUserName)
        if (!offerToUpdate) {
            console.warn("No OfferToUpdate: ", offerObj.offererUserName);
            console.error("Cannot answer. data-structure error. FATAL. ");
            return;
        }
        //send back to the answerer all the iceCandidates we have already collected
        ackFunction(offerToUpdate.offerIceCandidates);
        offerToUpdate.answer = offerObj.answer;
        offerToUpdate.answererUserName = userName;
        //socket has a .to() which allows emiting to a "room"
        //every socket has it's own room
        socket.to(socketIdToAnswer).emit('answerResponse', offerToUpdate);
    })

    socket.on('sendIceCandidateToSignalingServer', iceCandidateObj => {
        const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;
        // console.log(iceCandidate);
        if (didIOffer) {
            //this ice is coming from the offerer. Send to the answerer
            const offerInOffers = offers.find(o => o.offererUserName === iceUserName);
            if (offerInOffers) {
                console.log("--adding icecandidate for the user:", iceUserName);
                console.log(iceCandidate);
                console.log("----------------------------------------------------");
                offerInOffers.offerIceCandidates.push(iceCandidate)
                // 1. When the answerer answers, all existing ice candidates are sent
                // 2. Any candidates that come in after the offer has been answered, will be passed through
                if (offerInOffers.answererUserName) {
                    //pass it through to the other socket
                    const socketToSendTo = connectedSockets.find(s => s.userName === offerInOffers.answererUserName);
                    if (socketToSendTo) {
                        socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate)
                    } else {
                        console.log("Ice candidate recieved but could not find answere")
                    }
                }
            }
        } else {
            //this ice is coming from the answerer. Send to the offerer
            //pass it through to the other socket
            const offerInOffers = offers.find(o => o.answererUserName === iceUserName);
            if (!offerInOffers) {
                console.warn("No matching data for this user: ", iceUserName);
                console.error("Cannot handle 'sendIceCandidateToSignalingServer' message. May be old sessions' clients are active with the browsers. Please restart them.")
                return;
            }
            const socketToSendTo = connectedSockets.find(s => s.userName === offerInOffers.offererUserName);
            if (socketToSendTo) {
                socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate)
            } else {
                console.warn("Ice candidate recieved but could not find offerer :", iceUserName);
                console.error("Cannot respond. data-structure error. FATAL. ");
                return;
            }
        }
        // console.log(offers)
    })

})
