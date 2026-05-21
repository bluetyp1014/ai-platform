"use client";

import { useState } from "react";

export default function Home() {

  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {

    if (!message.trim()) return;

    setLoading(true);

    try {

      const res = await fetch("http://localhost:8003/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message }),
      });

      if (!res.body) {
        const data = await res.json();
        setResponse(data.response || "");
        setMessage("");
        return;
      }

      setResponse("");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setResponse((prev) => prev + chunk);
      }

      setMessage("");

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-6">
    <div className="p-8 max-w-11/12 mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        AI Platform Chat
      </h1>

      <div className="flex gap-2 mb-6">

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}  
          placeholder="Type message..."
          className="border rounded px-4 py-2 flex-1"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? "Loading..." : "Send"}
        </button>

      </div>

      <div className="border rounded p-4 min-h-50 whitespace-pre-wrap">

        {response}

      </div>

    </div>
    </main>
  );
}