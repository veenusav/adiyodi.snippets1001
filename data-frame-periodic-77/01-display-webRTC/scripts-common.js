const DATA_PRODUCTION_FPS = 33;
const FRAME_SIZE_IN_KB = 150;
const NO_OF_FRAMES = 700;
const DISPLAY_SLICE = 5; // ensure enough numbers in the frame. DISPLAY_SLICE * sizeof(number) < FRAME_SIZE_IN_KB*1024
// //import React, { useState, useEffect, useRef } from 'react';
// import {sizeof} from 'object-sizeof';

// const SIZE_OF_DATOM = sizeof(Math.floor(Math.random() * 65536));//in bytes
// console.log("datom size: ", SIZE_OF_DATOM);
// const NO_ELEMENTS_FOR_FRAME = (FRAME_SIZE_IN_KB*1024)/SIZE_OF_DATOM;

// function populateFrameData(n) {
//   const frame = [];
//   for (let i = 0; i < n; i++) {
//     // Generate a random integer between 0 (inclusive) and 65535 (inclusive)
//     const randomNumber = Math.floor(Math.random() * 65536);
//     frame.push(randomNumber);
//   }
//   return frame;
// }

// function populateFramesData(numberOfFrames, elementsCountForEachFrame) {
//   // Check for invalid input (n should be a positive integer)
//   if (numberOfFrames <= 0 || !Number.isInteger(numberOfFrames)) {
//     throw new Error('Invalid input: numberOfFrames must be a positive integer');
//   }
//   // Check for invalid input (n should be a positive integer)
//   if (elementsCountForEachFrame <= 0 || !Number.isInteger(elementsCountForEachFrame)) {
//     throw new Error('Invalid input: elementsCountForEachFrame must be a positive integer');
//   }
//   const frames = [];
//   for (let i = 0; i < numberOfFrames; i++) {
//     const frame=populateFrameData(elementsCountForEachFrame);
//     frames.push(frame);
//   }
//   return frames;
// }

// const FRAMES = populateFramesData(NO_OF_FRAMES,NO_ELEMENTS_FOR_FRAME);

// //--- initialization done

// console.log("DATA_PRODUCTION_FPS: ",DATA_PRODUCTION_FPS);
const DATA_PUBLISH_INTERVAL = 1000 / DATA_PRODUCTION_FPS; // milliseconds
// console.log("DATA_PUBLISH_INTERVAL: ", DATA_PUBLISH_INTERVAL," ms");
// const f0Len = FRAMES[0].length;
// const f00Bytes = sizeof(FRAMES[0][0]);
// console.log("dataframe[0][0] has a memory footprint of ", f00Bytes," bytes");
// const f0Bytes = f00Bytes*f0Len; // when if call sizeof(FRAMES[0]) it is giving a lesser figure which i cannot trust. for example for 100 elements 573bytes instead of 800 bytes!
// console.log("dataframe[0] has ",f0Len," elements. Has a memory footprint of ", f0Bytes," bytes (",f0Bytes/1024,"KB)." );

// //--- initial logs done

//Web server related configuration
const WEB_SERVER_URL = 'https://localhost:8181/'; // Caution: Obviously! it is used in server as well!
//const WEB_SERVER_URL = 'https://LOCAL-DEV-IP-HERE:8181/'; //if trying it on a phone, use this instead...

const USER_PWD = "x"; // Caution: This is also used in server for validation.
const USER_PREFIX = "USER-";

//WebRTC related configuration
// DEFAULT_STUN_SERVERS = [
//     {
//         urls: [
//             'stun:stun.l.google.com:19302',
//             'stun:stun1.l.google.com:19302'
//         ]
//     }
// ];

// DEFAULT_STUN_SERVERS = [
//     {
//         urls: [
//             'stun:localhost:3478', // when we run a stun server locally. 
//         ]
//     }
// ];
//DEFAULT_STUN_SERVERS =  ['stun:localhost:3478']; 
DEFAULT_STUN_SERVERS = []; // let the system decide 

//--------------------------------------
const userName = USER_PREFIX + Math.floor(Math.random() * 100000);
const password = USER_PWD;

const socket = io.connect(WEB_SERVER_URL, {
    auth: {
        userName, password
    }
})

// All these call-back functions' data
// are from the peer through the signaling server

//onGettingOffers(offers)
//when we receive offers
let onGettingOffers;

//onAnswerResponse(offers)
//when the peer accepted our offer (aka answer)
let onAnswerResponse;

//onReceivedIceCandidates(iceCandidate)
// when we receive iceCandidates 
let onReceivedIceCandidates;

//on connection to signaling serve we get all available offers 
socket.on('availableOffers', offers => {

    console.log(offers)
    if (onGettingOffers != undefined)
        onGettingOffers(offers);
})

//someone made a new offer and we're already here
socket.on('newOfferAwaiting', offers => {
    console.log(offers)
    if (onGettingOffers != undefined)
        onGettingOffers(offers);
})

//someone accepted our offer
socket.on('answerResponse', offerObj => {
    console.log(offerObj)

    if (onAnswerResponse != undefined)
        onAnswerResponse(offerObj);
})

socket.on('receivedIceCandidateFromServer', iceCandidate => {
    if (onReceivedIceCandidates != undefined)
        onReceivedIceCandidates(iceCandidate)
})


//==================================================
//---------- WebRTC generic functions --------------
//==================================================

let peerConnection; //the peerConnection that the two clients use to talk
let dataChannel;
let didIOffer = false; // this code has been shared by both producer and consumer. Will be true only for the producer.
let peerConfiguration = {
    iceServers: DEFAULT_STUN_SERVERS
}

// the callback function pointers. if defined, it will be called at webRTC events
let webrtc_onOfferGenerated; //sender/producer side
let webrtc_onOfferAnswered; //receiver/consumer side
let webrtc_onConnectionStarted;
let webrtc_onConnectionStopped;
let webrtc_onMessage; //receiver/consumer side.  signature: webrtc_onMessage(textmsg)


const closeExistingPeerConnection = () => {
    if (peerConnection === undefined)
        return;
    console.warn("Closing exiting peerConnection.");
    peerConnection.close();
    // discarding existing connection. 
    onAnswerResponse = undefined; // not honoring any offers we have made.
    onReceivedIceCandidates = undefined; // dont have peer connection to keep them
    dataChannel = undefined;
    peerConnection = undefined;

    // Caution: 
    // these objects will be closed async. 
    // The onClose routines will be triggered then. So, dont use these variables in the onClose routines. 
    // It might be even a new peerconnection or datachannel.

    socket.emit('removeOffer'); //unregister my offer with signalingServer
}

const createPeerConnection = (offerObj) => {
    closeExistingPeerConnection();
    return new Promise(async (resolve, reject) => {
        //RTCPeerConnection is the thing that creates the connection
        //we can pass a config object, and that config object can contain stun servers
        //which will fetch us ICE candidates
        console.log("About to create RTCPeerConnection.");
        peerConnection = await new RTCPeerConnection(peerConfiguration);

        onReceivedIceCandidates = (iceCandidate) => {
            if (peerConnection === undefined)
                return;
            peerConnection.addIceCandidate(iceCandidate)
            console.log("======Added Ice Candidate======")
            console.log(iceCandidate)
            console.log("===============================")
        }
        peerConnection.addEventListener("signalingstatechange", (event) => {
            console.log(event);
            console.log(peerConnection.signalingState)
        });

        peerConnection.addEventListener(
            "connectionstatechange",
            (event) => {
                console.log("connectionstatechange informed:");
                switch (peerConnection.connectionState) {
                    case "new":
                    case "connecting":
                        console.log("Connecting…");
                        break;
                    case "connected":
                        console.log("Online");
                        break;
                    case "disconnected":
                        console.log("Disconnecting…");
                        break;
                    case "closed":
                        console.log("Offline");
                        break;
                    case "failed":
                        console.log("Error");
                        break;
                    default:
                        console.log("UNKNOWN");
                        break;
                }
            },
            false,
        );

        peerConnection.addEventListener('icecandidate', e => {

            if (e.candidate) {
                console.log('Found Ice candidate ......')
                console.log(e)
                console.log('Informing others about this Ice candidate discovery. using socket.')
                socket.emit('sendIceCandidateToSignalingServer', {
                    iceCandidate: e.candidate,
                    iceUserName: userName,
                    didIOffer,
                })
            }
        })

        peerConnection.addEventListener('track', e => {
            console.warn("Got a track from the other peer!! This is not expected for this data exchange application")
            console.log(e)
        })

        if (dataChannel != undefined)
            console.warn("dataChannel should not have created before this point!");
        else {
            dataChannel = peerConnection.createDataChannel("textChannel");
            console.log("Data channel created : ", dataChannel);
            // Event listeners for data channel (optional):
            dataChannel.addEventListener("open", () => {
                console.log("Data channel opened!");

                if (webrtc_onConnectionStarted != undefined)
                    webrtc_onConnectionStarted();

                // dataChannel.addEventListener("message", (event) => {
                //     console.log("DData channel Received text message:", event.data);
                //     // Update UI or handle message content here
                // });            
            });
            dataChannel.onclose = function (event) {

                console.log(' Data channel closed', event);

                if (webrtc_onConnectionStopped != undefined)
                    webrtc_onConnectionStopped();

                if (peerConnection === undefined && dataChannel === undefined) {
                    console.log("Connection might have hanged up at our side.");
                    console.log("Caution: this might be the old datachannel being closed. And delyed response by webRTC.");
                } else if (peerConnection === undefined && dataChannel != undefined) {
                    console.error("Strange condition. A valid dataChannel without a valid peer connection. anyway setting dataChannel also undefined.");
                    dataChannel = undefined;
                } else if (peerConnection != undefined && dataChannel === undefined) {
                    console.warn("Strange condition. A valid peer connection without creating a valid dataChannel." +
                        "this data channel might be from the old closure. hope another dataChannel is being created asynchronously.");
                } else if (peerConnection != undefined && dataChannel != undefined) {
                    console.log("Both peerconnection and dataChannel are having values. So the other peer might have exited. " +
                        "Let us SHUTDOWN the peer connection as well. ");
                    closeExistingPeerConnection();
                }
            };
            dataChannel.onerror = function (err) {
                console.warn(' Data channel error', err);
            };

            console.log("registering ondatachannel callback.");
            peerConnection.ondatachannel = (event) => {
                const dChannel = event.channel;
                dChannel.onmessage = (messageEvent) => {
                    if (webrtc_onMessage != undefined)
                        webrtc_onMessage(messageEvent.data);
                    else
                        // comment this as it will flood browser console
                        console.warn("discarding p2p msg: ", messageEvent.data);
                };
            };

            peerConnection.onclose = (event) => {
                console.log("peerconnection closed", event);
            }
        }


        if (offerObj) {
            //this won't be set when called from call();
            //will be set when we call from answerOffer()
            // console.log(peerConnection.signalingState) //should be stable because no setDesc has been run yet
            await peerConnection.setRemoteDescription(offerObj.offer)
            // console.log(peerConnection.signalingState) //should be have-remote-offer, because client2 has setRemoteDesc on the offer

        }
        resolve();
    })
}


function sendText(message) {
    if (peerConnection === undefined)
        return;
    if (dataChannel === undefined)
        return;

    if (dataChannel.readyState === "open") {
        dataChannel.send(message);
        // console.log("data sent: ", message);
    } else {
        // console.warn("Data channel is not open, cannot send message:", message);
    }
}

//==================================================
//---------- WebRTC producer side functions --------
//==================================================
//Master logic:
//When a client initiates a call, call() will be triggered. 
//When the remote machine accepts the offer, addAnswer() will be called.
//Then data channel can be utilized from sendText() periodically.
//At anypoint, hangup() can be called.

//Executed to initiate a peer to peer connection and 
//send my offer for the other to the signaling server
const call = async e => {
    console.log("call requested.");
    //peerConnection is all set with our STUN servers sent over
    await createPeerConnection();
    //create offer time!
    try {
        console.log("Creating offer...");
        const offer = await peerConnection.createOffer();
        console.log(offer);
        peerConnection.setLocalDescription(offer);
        didIOffer = true;
        //onAnswerResponse()
        // will be called when the peer responsed to my offer.
        onAnswerResponse = async (offerObj) => {
            if (peerConnection === undefined) {
                console.error("peerconnection not started. somebody sent answer. discarding it");
                return;
            }
            console.log("Our offer accepted. Got answer!");
            //addAnswer is called in socketListeners when an answerResponse is emitted.
            //at this point, the offer and answer have been exchanged!
            //now CLIENT1 needs to set the remote
            await peerConnection.setRemoteDescription(offerObj.answer)
            // console.log(peerConnection.signalingState)

            //'Call' answered and connection established.
            if (webrtc_onOfferAnswered != undefined)
                webrtc_onOfferAnswered();

        }
        socket.emit('newOffer', offer); //send offer to signalingServer
        if (webrtc_onOfferGenerated != undefined)
            webrtc_onOfferGenerated();

        // //======================== VEENUS ADDITION FOR AVOIDING STUN ====== BEGIN
        // const candidateDefault = '930039970 1 udp 2122260223 192.168.229.179 62809 typ host generation 0 ufrag 1+5w network-id 1'
        // console.log(".vav. sending default ICE Candidate. BEGIN ");
        // console.log(candidateDefault);  
        // addNewIceCandidate(candidateDefault)
        // socket.emit('sendIceCandidateToSignalingServer',{
        //     iceCandidate: candidateDefault,
        //     iceUserName: userName,
        //     didIOffer,
        // }) 
        // console.log(".vav. sending default ICE Candidate. END ");
        // //======================== VEENUS ADDITION FOR AVOIDING STUN ======END
    } catch (err) {
        console.log("error at call().");
        console.log(err);
    }

}



// hangup()
// will be called when I am dropping from the conection.. offers will be ended and 
// the WebRTCconnection as well.
const hangup = async e => {
    console.log("hanging up data transmission activities... ")
    closeExistingPeerConnection();
}
//==================================================
//---------- WebRTC consumer side functions --------
//==================================================

// answerOffer()
// Will be triggered when the client(receiving end or consumer) 
// accepts the offer sent by the producer. 
// creates a peer connection and set the offer as 
// remote description and respond an WebRTC style answer to the sender through
// the signaling server(socket). 
// When the producer sets this answer as remote description at its end, 
// the connection will be through and the signaling server 
// is not noteed. see onAnswerResponse() for this logic.
// However, for that the signaling server has to passes the answer to the producer.
const answerOffer = async (offerObj) => {
    console.log("Answering the offer.");

    if (peerConnection != undefined)
        console.warn("New connection requested by the user while another exists. ");

    // await fetchUserMedia()
    await createPeerConnection();

    // console.log(peerConnection.signalingState) //should be stable because no setDesc has been run yet
    await peerConnection.setRemoteDescription(offerObj.offer);
    // console.log(peerConnection.signalingState) //should be have-remote-offer, because client2 has setRemoteDesc on the offer

    const answer = await peerConnection.createAnswer({}); //just to make the docs happy
    await peerConnection.setLocalDescription(answer); //this is CLIENT2, and CLIENT2 uses the answer as the localDesc
    console.log(offerObj)
    console.log(answer)
    // console.log(peerConnection.signalingState) //should be have-local-pranswer because CLIENT2 has set its local desc to it's answer (but it won't be)
    //add the answer to the offerObj so the server knows which offer this is related to
    offerObj.answer = answer
    //emit the answer to the signaling server, so it can emit to CLIENT1
    //expect a response from the server with the already existing ICE candidates
    const offerIceCandidates = await socket.emitWithAck('newAnswer', offerObj)
    offerIceCandidates.forEach(c => {
        peerConnection.addIceCandidate(c);
        console.log("======Added Ice Candidate======")
    })
    console.log(offerIceCandidates)
}
const AVG_FPS_UI_UPDATE_INERVAL = 2000; //in milliseconds.
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

//=== producer side functions
initProducer = () => {

    //-- init states and buttons/controls
    enableUI("call");
    disableUI("hangup");

    //--hook on internal states
    let frameCount = 0;
    let firstFrameTimestamp = performance.now();
    let lastFrameTimestamp = performance.now();
    let averageFps = 0;
    let AVGUIUpdatedTimestamp = performance.now();

    webrtc_onOfferGenerated = () => {
        console.log("webrtc_onOfferGenerated() ");

    }
    webrtc_onOfferAnswered = () => {
        console.log("webrtc_onOfferAnswered() ");
    }
    webrtc_onConnectionStarted = () => {
        console.log("webrtc_onConnectionStarted() ");
        enableUI("hangup");
        disableUI("call");

        //initing all counters for FPS calc - connection is a fresh start
        frameCount = 0;
        lastFrameTimestamp = performance.now();
        averageFps = 0;
        AVGUIUpdatedTimestamp = performance.now();

        console.log("resetting FPS calculation... begin")
        frameCount = 0;
        const now = performance.now();
        firstFrameTimestamp = now;
        lastFrameTimestamp = now;
        averageFps = 0;
        AVGUIUpdatedTimestamp = now;
        console.log("Resetting FPS calculation... end");
        // console.log("averageFps, frameCount+1, firstFrameTimestamp,now, (now - firstFrameTimestamp), (now - firstFrameTimestamp)/(frameCount + 1)");
        // console.log(averageFps, frameCount + 1, firstFrameTimestamp, now, (now - firstFrameTimestamp), (now - firstFrameTimestamp) / (frameCount + 1));


    }
    webrtc_onConnectionStopped = () => {
        console.log("webrtc_onConnectionStopped() ");
        enableUI("call");
        disableUI("hangup");
    }

    //-- initializes constant values on UI
    document.getElementById("user-name").innerHTML = userName;
    document.getElementById("targetted_fps").innerHTML = DATA_PRODUCTION_FPS;

    //--hooks on UI
    document.querySelector('#call').addEventListener('click', call);
    document.querySelector('#hangup').addEventListener('click', hangup);

    //------ Data production side ----- 

    function produceData() {
        document.getElementById("frameID").innerHTML = frameCount;

        //-- fps calculation
        const now = performance.now();
        const elapsedTime = now - lastFrameTimestamp;

        // Update FPS
        const currentFps = Math.round(1000 / elapsedTime);

        // Update average FPS
        // averageFps = (averageFps * frameCount + currentFps) / (frameCount + 1);
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

        //--- gathering new data
        //todo: now assigning some junk lengthy data
        someData = JSON.stringify({
            "glossary": {
                "title": "example glossary",
                "GlossDiv": {
                    "title": "S",
                    "GlossList": {
                        "GlossEntry": {
                            "ID": "SGML",
                            "SortAs": "SGML",
                            "GlossTerm": "Standard Generalized Markup Language",
                            "Acronym": "SGML",
                            "Abbrev": "ISO 8879:1986",
                            "GlossDef": {
                                "para": "A meta-markup language, used to create markup languages such as DocBook.",
                                "GlossSeeAlso": ["GML", "XML"]
                            },
                            "GlossSee": "markup"
                        }
                    }
                }
            }
        }, null, 2);
        const randomValue = Math.floor(Math.random() * 100000);
        const dataFrame = userName + " | " + randomValue + "\n" + someData;
        document.getElementById("dataFrame").innerHTML = dataFrame.slice(0, 300);
        sendText(dataFrame); //create data channel and send text. also receive
        document.getElementById("current_frame_size").innerHTML = (dataFrame.length / 1024).toFixed(4) + "kb";

        frameCount++;
    }
    console.log("Data production interval ", DATA_PUBLISH_INTERVAL, " ms");
    setInterval(produceData, DATA_PUBLISH_INTERVAL); // update local text periodically 
}

//=== consumer side functions

initConsumer = () => {
    onGettingOffers = (offers) => {

        const answerEl = document.querySelector('#answer');
        if (answerEl === null) {
            console.error("Not configured as a Cosumer. - Discarding WebRTC offers received...");
            return;
        }

        while (answerEl.firstChild) { //remove all the existing answer buttons.
            answerEl.removeChild(answerEl.firstChild);
        }

        offers.forEach(o => {//make green answer button for all the offers available
            console.log(o);
            const newOfferEl = document.createElement('div');
            // btn-success class gives a green color
            newOfferEl.innerHTML = `<button class="btn btn-success col-1">Answer ${o.offererUserName}</button>`
            newOfferEl.addEventListener('click', () => answerOffer(o))
            answerEl.appendChild(newOfferEl);
        })
    };
    //-- init states and buttons/controls
    disableUI("hangup");

    //--hook on internal states

    let frameCount = 0;
    let firstFrameTimestamp = performance.now();
    let lastFrameTimestamp = performance.now();
    let averageFps = 0;
    let AVGUIUpdatedTimestamp = performance.now();
    webrtc_onConnectionStarted = () => {
        console.log("webrtc_onConnectionStarted() ");
        enableUI("hangup");
        const answerEl = document.querySelector('#answer');
        while (answerEl.firstChild) { //remove all the existing answer buttons.
            answerEl.removeChild(answerEl.firstChild);
        }
        //initing all counters for FPS calc. connection is a fresh start
        console.log("resetting FPS calculation... begin")
        frameCount = 0;
        const now = performance.now();
        firstFrameTimestamp = now;
        lastFrameTimestamp = now;
        averageFps = 0;
        AVGUIUpdatedTimestamp = now;
        console.log("Resetting FPS calculation... end");
        // console.log("averageFps, frameCount+1, firstFrameTimestamp,now, (now - firstFrameTimestamp), (now - firstFrameTimestamp)/(frameCount + 1)");
        // console.log(averageFps, frameCount + 1, firstFrameTimestamp, now, (now - firstFrameTimestamp), (now - firstFrameTimestamp) / (frameCount + 1));
    }
    webrtc_onConnectionStopped = () => {
        console.log("webrtc_onConnectionStopped() ");
        disableUI("hangup");
        document.getElementById("average_fps").innerHTML = "--.--";
        document.getElementById("current_fps").innerHTML = "-";
    }
    //------ Data display side ----- 
    webrtc_onMessage = (dataFrame) => {
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
        document.getElementById("dataFrame").innerHTML = dataFrame.slice(0, 300);
        frameCount++;
    };
    //--hooks on UI
    document.querySelector('#user-name').innerHTML = userName;
    document.querySelector('#hangup').addEventListener('click', hangup);

}
