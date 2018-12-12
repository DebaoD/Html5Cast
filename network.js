

function onIPGot(ip) {
    //alert(ip);
    sessionStorage.setItem("ipaddress", ip);
    //window.location.href="/CastToHtml5/Player/treeDemo.html";
    window.location.href="Player/treeDemo.html";
    /*
    var wsUrl = "ws://"+ip;
    if(window.WebSocket){
        console.log('This browser supports WebSocket');
    }else{
        console.log('This browser does not supports WebSocket');
    }

    var websocket = new WebSocket(wsUrl);

    websocket.onopen = function() {
        websocket.send("first message");
    }
    */
}