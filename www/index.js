let size = {
    rows: 40,
    cols: 120
}
let term = new Terminal({
    cursorBlink: true,
    cursorStyle: "block",
    bellSound: true,
    rows: size.rows,
    cols: size.cols
});
term.open(document.getElementById('terminal'));

let openSocket = function () {
    let socket = new WebSocket("ws://" + window.location.hostname + ":8098");
    let retry = function (socket) {
        term.write("\r\nsocket closed... retrying to connect");
        setTimeout(openSocket, 1000);
    }

    socket.onopen = function() {
        socket.send(JSON.stringify({
            type: "REQUEST_TTY",
            size
        }));
        new attach.attach(term, socket);
        term.focus();
    };

    socket.onerror = function (error) {
        console.error(error);
    }

    socket.onclose = function () {
        retry(socket)
    }
}
openSocket()