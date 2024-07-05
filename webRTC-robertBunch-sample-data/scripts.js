const userName = "Rob-" + Math.floor(Math.random() * 100000)
const password = "x";
document.querySelector('#user-name').innerHTML = userName;

//if trying it on a phone, use this instead...
// const socket = io.connect('https://LOCAL-DEV-IP-HERE:8181/',{
const socket = io.connect('https://localhost:8181/', {
    auth: {
        userName, password
    }
})

const localVideoEl = document.querySelector('#local-video');
const remoteVideoEl = document.querySelector('#remote-video');

let localStream; //a var to hold the local video stream
let remoteStream; //a var to hold the remote video stream
let peerConnection; //the peerConnection that the two clients use to talk
let didIOffer = false;
let dataChannel;
let peerConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302'
            ]
        }
    ]
}
// let peerConfiguration = {
//     iceServers:[]
// };
// let peerConfiguration = {
//     iceServers:[
//         {
//             urls:[
//               'stun:localhost:3478'

//             ]
//         }
//     ]
// }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  
function sendText(message) {
    if (peerConnection === undefined)
        return;
    if (dataChannel === undefined) 
        return;    

    if (dataChannel.readyState === "open") {
        dataChannel.send(message);
        console.log("data sent: ", message);
    } else {
        console.warn("Data channel is not open, cannot send message:", message);
    }
}

function updateLocalText() {
    const randomValue = Math.floor(Math.random() * 100000);
    const localMessage = userName + " | " + randomValue;
    document.querySelector('#local-text').innerHTML = localMessage;
    sendText(localMessage); //create data channel and send text. also receive
}

setInterval(updateLocalText, 4000); // update local text periodically 

//when a client initiates a call
const call = async e => {
    console.log("call requested.");
    await fetchUserMedia();
    //peerConnection is all set with our STUN servers sent over
    await createPeerConnection();
    //create offer time!
    try {
        console.log("Creating offer...");
        const offer = await peerConnection.createOffer();
        console.log(offer);
        peerConnection.setLocalDescription(offer);
        didIOffer = true;
        socket.emit('newOffer', offer); //send offer to signalingServer
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
        console.log(err)
    }

}

const answerOffer = async (offerObj) => {
    await fetchUserMedia()
    await createPeerConnection(offerObj);
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

const addAnswer = async (offerObj) => {
    //addAnswer is called in socketListeners when an answerResponse is emitted.
    //at this point, the offer and answer have been exchanged!
    //now CLIENT1 needs to set the remote
    await peerConnection.setRemoteDescription(offerObj.answer)
    // console.log(peerConnection.signalingState)
}

const fetchUserMedia = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                // audio: true,
            });
            localVideoEl.srcObject = stream;
            localStream = stream;
            resolve();
        } catch (err) {
            console.log(err);
            reject()
        }
    })
}

const createPeerConnection = (offerObj) => {

    return new Promise(async (resolve, reject) => {
        //RTCPeerConnection is the thing that creates the connection
        //we can pass a config object, and that config object can contain stun servers
        //which will fetch us ICE candidates
        console.log("About to create RTCPeerConnection.");
        peerConnection = await new RTCPeerConnection(peerConfiguration)
        remoteStream = new MediaStream()
        remoteVideoEl.srcObject = remoteStream;


        localStream.getTracks().forEach(track => {
            //add localtracks so that they can be sent once the connection is established
            peerConnection.addTrack(track, localStream);
        })

        peerConnection.addEventListener("signalingstatechange", (event) => {
            console.log(event);
            console.log(peerConnection.signalingState)
        });

        peerConnection.addEventListener('icecandidate', e => {
            console.log('........Ice candidate found!......')
            console.log(e)
            if (e.candidate) {
                socket.emit('sendIceCandidateToSignalingServer', {
                    iceCandidate: e.candidate,
                    iceUserName: userName,
                    didIOffer,
                })
            }
        })



        peerConnection.addEventListener('track', e => {
            console.log("Got a track from the other peer!! How excting")
            console.log(e)
            e.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track, remoteStream);
                console.log("Here's an exciting moment... fingers cross")
            })
        })

        if (dataChannel != undefined)
            console.warn("dataChannel should not have created before this point!");
        else {
            dataChannel = peerConnection.createDataChannel("textChannel");
            console.log("Data channel created : ", dataChannel);
            // Event listeners for data channel (optional):
            // addDataChannelListeners(dataChannel, userName)

            dataChannel.addEventListener("open", () => {
                console.log("Data channel opened!");
                // dataChannel.addEventListener("message", (event) => {
                //     console.log("DData channel Received text message:", event.data);
                //     // Update UI or handle message content here
                // });            
            });
            dataChannel.onclose = function (event) {
                console.log(' data channel close', event);
            };
            dataChannel.onerror = function (err) {
                console.log(' data channel error', err);
            };

            console.log("registering ondatachannel callback.");
            peerConnection.ondatachannel = (event) => {
                const dChannel = event.channel;
                dChannel.onmessage = (messageEvent) => {
                    // console.log("Received message:", messageEvent.data);
                    document.querySelector('#remote-text').innerHTML = messageEvent.data;
                };
            };                       
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

const addNewIceCandidate = iceCandidate => {
    peerConnection.addIceCandidate(iceCandidate)
    console.log("======Added Ice Candidate======")
    console.log(iceCandidate)
    console.log("===============================")
}




document.querySelector('#call').addEventListener('click', call)