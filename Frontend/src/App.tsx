import { useState, useRef, useEffect } from "react";

import "./App.css";

function App() {
  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [name, setName] = useState<string>("");

  //Refs to store WebSocket connection and input element
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!name) return;
    const ws = new WebSocket("ws://localhost:8080");

    //Handling incoming messages from server
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat" && data.payload) {
          setMessages((m) => [...m, { sender: data.payload.sender, message: data.payload.message }]);
        } else {
          // fallback for plain string messages
          setMessages((m) => [...m, { sender: "Unknown", message: event.data }]);
        }
      } catch {
        setMessages((m) => [...m, { sender: "Unknown", message: event.data }]);
      }
    };

    wsRef.current = ws;

    //When connection opens , send join room message
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          payload: {
            roomId: "red", //Join room with Id "red"
          },
        })
      );
    };

    //Cleanup : close WebSocket connection when component unmounts
    return () => {
      ws.close();
    };
  }, [name]);

  // Prompt for name only once, before websocket effect runs
  useEffect(() => {
    if (!name) {
      let userName = "";
      while (!userName) {
        userName = prompt("Enter your name:") || "";
      }
      setName(userName);
    }
  }, [name]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 to-black">
      {/* Header */}
      <header className="py-6 px-8 bg-purple-800 shadow-lg flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-wide">Chat Room</h1>
        <span className="text-purple-200 text-sm">Room: <span className="font-semibold text-white">red</span></span>
      </header>

      {/* Messages Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="text-center text-purple-200">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg, idx) => (
              <div
                className={`self-start max-w-[70%] rounded-2xl px-5 py-3 shadow-md bg-white text-black text-lg animate-fadeIn`}
                key={idx}
              >
                <div className="text-xs text-gray-500 mb-1 text-left">{msg.sender}</div>
                <div>{msg.message}</div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-black py-4 px-6 shadow-inner flex items-center gap-3">
        <input
          ref={inputRef}
          id="message"
          className="flex-1 p-3 rounded-full border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg bg-black text-white placeholder-gray-400 shadow-sm"
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const msg = inputRef.current?.value;
              if (msg && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: "chat",
                    payload: {
                      message: msg,
                      sender: name,
                    },
                  })
                );
                if (inputRef.current) inputRef.current.value = "";
              }
            }
          }}
        />
        <button
          onClick={() => {
            const msg = inputRef.current?.value;
            if (msg && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: "chat",
                  payload: {
                    message: msg,
                    sender: name,
                  },
                })
              );
              if (inputRef.current) inputRef.current.value = "";
            }
          }}
          className="bg-purple-700 hover:bg-purple-800 transition text-white font-semibold px-6 py-3 rounded-full shadow-md text-lg"
        >
          Send
        </button>
      </footer>
    </div>
  );
}

export default App;
