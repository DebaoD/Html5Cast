
var pktNum = 0;
var framesList = [];

const MOU_STATUS_MOVED        = 0x01;
const MOU_STATUS_B1DOWN       = 0x02;
const MOU_STATUS_B1UP         = 0x04;
const MOU_STATUS_B2DOWN       = 0x08;
const MOU_STATUS_B2UP         = 0x10;
const MOU_STATUS_B3DOWN       = 0x20;
const MOU_STATUS_B3UP         = 0x40;

function onGotIPAddress(broadway) {
    //alert(ip);
    var ip = sessionStorage.getItem("ipaddress");
    var wsUrl = "ws://"+ip+":1494";
    if(window.WebSocket){
        console.log('This browser supports WebSocket');
    }else{
        console.log('This browser does not supports WebSocket');
    }
    console.log("browser is:"+getBrowser().browserID);
    var websocket = new WebSocket(wsUrl);
    websocket.binaryType = "arraybuffer";

    websocket.onopen = function() {
        websocket.send("first message");
    }
    websocket.onmessage = function(e) {
        if (typeof e.data =="string") {
            console.log('got message:' + e.data);
            connectMouse(ip);
            return;
        }
        pktNum++;
        var frame = new Uint8Array(e.data);
        console.log('got frame '+pktNum+'. length='+frame.length)
        framesList.push(frame);
        broadway.play();
    }

}

var mouseSocket;
var isMouseOpen = false;

var connectMouse = function(ip) {
    var wsUrl = "ws://"+ip+":2598";
    mouseSocket = new WebSocket(wsUrl);
    mouseSocket.binaryType = "arraybuffer";
    mouseSocket.onopen = function() {
        isMouseOpen = true;
        mouseSocket.send("first mouse message");
    };


    mouseSocket.onmessage = function(e) {
        if (typeof e.data =="string") {
            console.log('got message:' + e.data);
            sendMouseEvent("handshakeDone");
            return;
        }
    }

    mouseSocket.onclose = function () {
        isMouseOpen = false;
    }
};

var sendMouseEvent = function(s) {
    mouseSocket.send(s);
};

var sendMouseEventBin = function(type, x, y, wheelDelta) {
    let data = new ArrayBuffer(14);
    let view = new DataView(data);
    view.setUint8(0, 0x0C);
    view.setUint8(1, type);
    view.setUint32(2, x);
    view.setUint32(6, y);
    view.setUint16(10, wheelDelta);
    view.setUint16(12, 0);
    mouseSocket.send(data);
};

var writePacketKeyboardUnicode = function(unicode, typeOfKey) {
    console.log("keyEvent.writePacketKeyboardUnicode.unicode="+unicode+";typeOfKey="+typeOfKey);
    let data = new ArrayBuffer(5);
    let view = new DataView(data);
    view.setUint8(0, 8);
    view.setUint16(1, unicode);
    view.setUint8(3, typeOfKey);
    view.setUint8(4, 0);
    mouseSocket.send(data);
};

var writePacketSetLed = function(ledBitmask) {
    console.log("keyEvent.writePacketSetLed.ledBitmask="+ledBitmask);
    let data = new ArrayBuffer(2);
    let view = new DataView(data);
    view.setUint8(0, 6);
    view.setUint8(1, ledBitmask);
    mouseSocket.send(data);
};