const inputEl = document.body.querySelector("input");
const sendButton = document.body.querySelector("#send");
const msgContainer = document.body.querySelector("#log");
const hostButton = document.body.querySelector("#host");
const joinButton = document.body.querySelector("#join");
const addGuestButton = document.body.querySelector("#add");

hostButton.addEventListener("click", ()=>{
    const lc = new RTCPeerConnection();
    const dc = lc.createDataChannel("channel");

    hostButton.style.display = "none";
    joinButton.style.display = "none";
    addGuestButton.style.display = "inline-block";

    addGuestButton.addEventListener("click", ()=>{
        const input = window.prompt("Guest SDP:");
        if (input?.length){
            const answer = JSON.parse(input);
            lc.setRemoteDescription(answer);
        }
    });

    function send(message){
        dc.send(message);
        inputEl.value = "";
    }

    function addMessage(message, who = null){
        const textEl = document.createElement("p");
        if (who !== null){
            textEl.innerText = `${who}: ${message}`;
        } else {
            textEl.innerText = message;
        }
        msgContainer.appendChild(textEl);
        msgContainer.scroll({
            top: msgContainer.scrollHeight,
            left: 0,
            behavior: "auto",
        });
    }

    // Data channel events
    dc.onmessage = (e) => {
        console.log("Message:", e.data);
        addMessage(e.data, "Guest"); 
    }
    dc.onopen = (e) => {
        console.log("Connection open!");
        addMessage("The Guest has connected.");
        addGuestButton.style.display = "none";
        sendButton.addEventListener("click", ()=>{
            addMessage(inputEl.value, "You");
            send(inputEl.value);
        });
        inputEl.addEventListener("keypress", (e)=>{
            if (e instanceof KeyboardEvent && e.key.toLowerCase() === "enter"){
                addMessage(inputEl.value, "You");
                send(inputEl.value);
            }
        });
    }

    // Fires when a new Ice Candidate is created.
    const handleNewIceCandidate = (e) => {
        const SDP = JSON.stringify(lc.localDescription);
        console.log("New Ice Candidate! Reprinting SDP:", SDP);
        const dd = document.body.querySelector("dd");
        dd.innerText = SDP;
    }
    lc.onicecandidate = debounce(handleNewIceCandidate.bind(this), 300);

    // Creates offer
    lc.createOffer()
        .then(o => {
            lc.setLocalDescription(o);
        })
        .then(()=>{
            console.log("Set local description successfully");
        });
});

joinButton.addEventListener("click", ()=>{

    hostButton.style.display = "none";
    joinButton.style.display = "none";
    
    const input = window.prompt("Host SDP:");
    if (input?.length){
        const offer = JSON.parse(input);
        const rc = new RTCPeerConnection();

        function send(message){
            rc.dc.send(message);
            inputEl.value = "";
        }

        function addMessage(message, who = null){
            const textEl = document.createElement("p");
            if (who !== null){
                textEl.innerText = `${who}: ${message}`;
            } else {
                textEl.innerText = message;
            }
            msgContainer.appendChild(textEl);
            msgContainer.scroll({
                top: msgContainer.scrollHeight,
                left: 0,
                behavior: "auto",
            });
        }

        rc.onicecandidate = debounce((e) => {
            const SDP = JSON.stringify(rc.localDescription);
            console.log("New Ice Candidate! Reprinting SDP:", SDP);
            const dd = document.body.querySelector("dd");
            dd.innerText = SDP;
        }, 300);
        rc.ondatachannel = (e) => {
            console.log("Recieved data channel!");
            rc.dc = e.channel;
            rc.dc.onmessage = (e) => {
                console.log("Message:", e.data);
                addMessage(e.data, "Host");
            }
            rc.dc.onopen = (e) => {
                console.log("Connection open!");
                addMessage("You are now connected to the Host.");
                sendButton.addEventListener("click", ()=>{
                    addMessage(inputEl.value, "You");
                    send(inputEl.value);
                });
                inputEl.addEventListener("keypress", (e)=>{
                    if (e instanceof KeyboardEvent && e.key.toLowerCase() === "enter"){
                        addMessage(inputEl.value, "You");
                        send(inputEl.value);
                    }
                });
            }
        }
        rc.setRemoteDescription(offer)
            .then(()=>{
                console.log("Offer set");
            });
        rc.createAnswer()
            .then(a => {
                rc.setLocalDescription(a).then(()=>{
                    console.log("Answer created");
                });
            });
    } else {
        hostButton.style.display = "inline-block";
        joinButton.style.display = "inline-block";
    }
});

const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
}
