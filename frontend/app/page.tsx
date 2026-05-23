"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthGuard } from "@/components/AuthGuard";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

function conversationStorageKey(username: string | null) {
  return username
    ? `ai-platform-conversation-id-${username}`
    : "ai-platform-conversation-id";
}

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
};

function MessageBubble({
  content,
  role,
}: {
  content: string;
  role: string;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  async function copyText() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`group relative max-w-[85%] rounded-lg px-4 py-3 pr-10 ${
          isUser
            ? "bg-sky-700 text-white whitespace-pre-wrap"
            : "bg-slate-800 text-slate-100"
        }`}
      >
        <button
          type="button"
          onClick={copyText}
          title="Copy message"
          className={`absolute top-2 right-2 z-10 rounded px-1.5 py-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 ${
            isUser
              ? "bg-sky-500/80 hover:bg-sky-400 text-white"
              : "bg-slate-700 hover:bg-slate-600 text-slate-200"
          }`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        {isUser ? content : <MarkdownMessage content={content} />}
      </div>
    </div>
  );
}

function ChatApp() {
  const router = useRouter();
  const username = useAuthStore((s) => s.username);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const storageKey = conversationStorageKey(username);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming]);

  const loadConversations = useCallback(async () => {
    const res = await apiFetch("/conversations");
    if (!res.ok) throw new Error("Failed to load conversations");
    return (await res.json()) as Conversation[];
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    const res = await apiFetch(`/conversations/${id}/messages`);
    if (!res.ok) throw new Error("Failed to load messages");
    return (await res.json()) as ChatMessage[];
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const list = await loadConversations();
        if (cancelled) return;
        setConversations(list);

        const savedId = localStorage.getItem(storageKey);
        if (savedId && list.some((c) => c.id === savedId)) {
          setConversationId(savedId);
          const history = await loadMessages(savedId);
          if (!cancelled) setMessages(history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }

    setBootstrapping(true);
    setConversationId(null);
    setMessages([]);
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadConversations, loadMessages, storageKey]);

  const selectConversation = async (id: string) => {
    setConversationId(id);
    localStorage.setItem(storageKey, id);
    setStreaming("");
    setLoading(true);
    try {
      const history = await loadMessages(id);
      setMessages(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    localStorage.removeItem(storageKey);
    setMessages([]);
    setStreaming("");
    setInput("");
  };

  const refreshSidebar = async (activeId?: string | null) => {
    const list = await loadConversations();
    setConversations(list);
    if (activeId) {
      setConversationId(activeId);
      localStorage.setItem(storageKey, activeId);
    }
  };

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setStreaming("");

    const optimisticUser: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      conversation_id: conversationId ?? "",
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat failed: ${res.status}`);
      }

      const newConversationId = res.headers.get("X-Conversation-Id");
      if (newConversationId) {
        setConversationId(newConversationId);
        localStorage.setItem(storageKey, newConversationId);
      }

      if (!res.body) {
        const data = await res.json();
        setStreaming(data.response ?? "");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreaming(accumulated);
      }

      setStreaming("");
      const activeId = newConversationId ?? conversationId;
      if (activeId) {
        const history = await loadMessages(activeId);
        setMessages(history);
        await refreshSidebar(activeId);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[#0f172a] text-slate-200 flex">
      <aside className="w-64 shrink-0 h-full border-r border-slate-700 flex flex-col overflow-hidden">
        <div className="shrink-0 p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold">AI Platform</h1>
          {username && (
            <p className="text-xs text-slate-500 mt-1 truncate" title={username}>
              {username}
            </p>
          )}
          <button
            type="button"
            onClick={startNewChat}
            className="mt-3 w-full rounded bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm"
          >
            + New Chat
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded border border-slate-600 hover:bg-slate-800 px-3 py-2 text-sm text-slate-300"
          >
            Log out
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1">
          {bootstrapping && (
            <p className="text-slate-500 text-sm px-2 py-1">Loading…</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectConversation(c.id)}
              className={`w-full text-left rounded px-3 py-2 text-sm truncate ${
                conversationId === c.id
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
              title={c.title}
            >
              {c.title}
            </button>
          ))}
          {!bootstrapping && conversations.length === 0 && (
            <p className="text-slate-500 text-sm px-2 py-1">No chats yet</p>
          )}
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="shrink-0 px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold">
            {conversationId
              ? conversations.find((c) => c.id === conversationId)?.title ??
                "Chat"
              : "New Chat"}
          </h2>
          {conversationId && (
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {conversationId}
            </p>
          )}
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4 space-y-4">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
            />
          ))}

          {streaming && (
            <MessageBubble role="assistant" content={streaming} />
          )}

          {loading && !streaming && (
            <p className="text-slate-500 text-sm">Thinking…</p>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-slate-700">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message…"
              disabled={loading}
              className="flex-1 rounded border border-slate-600 bg-slate-900 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2 font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <ChatApp />
    </AuthGuard>
  );
}
