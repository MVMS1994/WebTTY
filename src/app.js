const path = require("path");
const WebSocket = require("ws");
const Pty = require("node-pty");
const express = require("express");

const app = express();
app.use(express.static(path.join(path.resolve(), 'www')));
app.listen(8090, () => { console.log("server is up at 8090"); });

let setupTty = function (socketClient, size) {
    socketClient.tty = Pty.spawn('zsh', [], {
        name: 'xterm-color',
        cols: size.cols,
        rows: size.rows,
        cwd: process.env.HOME,
        env: process.env
    });

    socketClient.tty.on('exit', function(code, signal) {
        socketClient.tty = null;
        socketClient.close();
    });

    socketClient.tty.on('data', (data) => {
        socketClient.send(data);
    });
}

const socketServer = new WebSocket.Server({port: 8098}, () => { console.log("socket is up at 8098") });

socketServer.on('connection', (socketClient) => {
    socketClient.on('close', () => {
        if (socketClient.tty) {
            socketClient.tty.kill(9);
            socketClient.tty = null;
        }
    });

    socketClient.on('message', (message) => {
        if(socketClient.tty) {
            socketClient.tty.write(message);
        } else {
            try {
                let cmd = JSON.parse(message);
                switch (cmd.type) {
                    case "REQUEST_TTY":
                        setupTty(socketClient, cmd.size);
                        break;
                    default:
                        socketClient.close();
                        break;
                }
            } catch (e) {
                socketClient.close();
            }
        }
    });
});