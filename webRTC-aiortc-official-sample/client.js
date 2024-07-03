var pc = null;
console.log("  1")
function negotiate() {
    console.log("  2")
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });
    console.log("  3")
    return pc.createOffer().then((offer) => {
        console.log("  4")
        return pc.setLocalDescription(offer);
    }).then(() => {
        console.log("  5")
        // wait for ICE gathering to complete
        return new Promise((resolve) => {
            console.log("  6")
            if (pc.iceGatheringState === 'complete') {
                console.log("  7")
                resolve();
                console.log("  8")
            } else {
                console.log("  9")
                const checkState = () => {
                    console.log(" 10")
                    if (pc.iceGatheringState === 'complete') {
                        console.log(" 11")
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        console.log(" 12")
                        resolve();
                        console.log(" 13")
                    }
                };
                console.log(" 14")
                pc.addEventListener('icegatheringstatechange', checkState);
                console.log(" 15")
            }
        });
    }).then(() => {
        console.log(" 16")
        var offer = pc.localDescription;
        return fetch('/offer', {
            body: JSON.stringify({
                sdp: offer.sdp,
                type: offer.type,
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });
    }).then((response) => {
        console.log(" 17")
        return response.json();
    }).then((answer) => {
        console.log(" 18")
        return pc.setRemoteDescription(answer);
    }).catch((e) => {
        console.log(" 19")
        alert(e);
    });
    console.log(" 20")
}

function start() {
    console.log(" 21")
    var config = {
        sdpSemantics: 'unified-plan',
        iceServers: [], // Use empty iceServers array to avoid reliance on external STUN/TURN servers
        iceTransportPolicy: 'all'  // Ensure we attempt to use all network paths (even though ICE servers list is empty)
    };
      
    if (document.getElementById('use-stun').checked) {
        console.log(" 22.a")
        config.iceServers = [{ urls: ['stun:stun.l.google.com:19302'] }];
    } else {
        console.log(" 22.b")
    }
    console.log(" 23")
    pc = new RTCPeerConnection(config);

    pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
          console.log('ICE connection state is disconnected');
          // Handle reconnection logic here if needed
        }
      };
      
    // connect audio / video
    pc.addEventListener('track', (evt) => {
        console.log(" 24")
        if (evt.track.kind == 'video') {
            console.log(" 25")
            document.getElementById('video').srcObject = evt.streams[0];
        } else {
            console.log(" 26")
            document.getElementById('audio').srcObject = evt.streams[0];
        }
    });
    console.log(" 27")
    document.getElementById('start').style.display = 'none';
    console.log(" 28")
    negotiate();
    console.log(" 29")
    document.getElementById('stop').style.display = 'inline-block';
    console.log(" 30")
}

function stop() {
    console.log(" 31")
    document.getElementById('stop').style.display = 'none';

    // close peer connection
    setTimeout(() => {
        console.log(" 32")
        pc.close();
    }, 500);
    console.log(" 33")
}
