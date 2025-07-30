"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let allSockets = [];
wss.on("connection", function (socket) {
    console.log("User connected ! ");
    //Handle what the user types
    socket.on("message", function (message) {
        let parsedMessage;
        try {
            //@ts-ignore
            parsedMessage = JSON.parse(message);
        }
        catch (e) {
            // If not JSON, treat as plain string and broadcast as JSON with sender name if available
            let currentUserRoom = null;
            let currentUserName = "Unknown";
            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i].socket === socket) {
                    currentUserRoom = allSockets[i].room;
                    if (allSockets[i].name)
                        currentUserName = String(allSockets[i].name);
                }
            }
            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i].room === currentUserRoom) {
                    allSockets[i].socket.send(JSON.stringify({
                        type: "chat",
                        payload: {
                            sender: currentUserName,
                            message: message,
                        },
                    }));
                }
            }
            return;
        }
        //Join handle karna hai ,handling whenever a user wants to join a
        if (parsedMessage.type === "join") {
            allSockets.push({
                socket,
                room: parsedMessage.payload.roomId,
            });
        }
        //Handling chat type, Whenever user wants to chat , when a user sends a chat
        if (parsedMessage.type === "chat") {
            //Finding the room and name of the User, jisne message bheja hai
            let currentUserRoom = null;
            let currentUserName = parsedMessage.payload.sender || "Unknown";
            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i].socket === socket) {
                    currentUserRoom = allSockets[i].room;
                    // Store/update name for this socket
                    allSockets[i].name = currentUserName;
                }
            }
            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i].room === currentUserRoom) {
                    allSockets[i].socket.send(JSON.stringify({
                        type: "chat",
                        payload: {
                            sender: currentUserName,
                            message: parsedMessage.payload.message,
                        },
                    }));
                }
            }
        }
    });
});
