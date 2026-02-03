"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
    role: "user" | "agent";
    agent?: string;
    content: string;
}

const HIVE_SERVER = process.env.NEXT_PUBLIC_HIVE_SERVER || "http://localhost:3000";

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch(`${HIVE_SERVER}/chat/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    threadId,
                }),
            });

            if (!response.ok) {
                throw new Error("Server error");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let currentContent = "";

            if (!reader) return;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === "thread") {
                                setThreadId(data.threadId);
                            } else if (data.type === "agent") {
                                if (currentContent) {
                                    // Save previous agent message
                                    setMessages((prev) => [
                                        ...prev,
                                        { role: "agent", content: currentContent },
                                    ]);
                                    currentContent = "";
                                }
                                setMessages((prev) => [
                                    ...prev,
                                    { role: "agent", agent: data.agent, content: "" },
                                ]);
                            } else if (data.type === "chunk") {
                                currentContent += data.content;
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    if (updated.length > 0 && updated[updated.length - 1]?.role === "agent") {
                                        updated[updated.length - 1] = {
                                            ...updated[updated.length - 1],
                                            content: currentContent,
                                        };
                                    }
                                    return updated;
                                });
                            }
                        } catch {
                            // ignore parse errors
                        }
                    }
                }
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "agent", content: "Error connecting to HIVE-R server" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Chat</h1>
                {threadId && (
                    <p className="text-sm text-zinc-500">Thread: {threadId.slice(0, 8)}...</p>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <span className="text-4xl mb-2">🐝</span>
                        <p>Start a conversation with HIVE-R</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-xl px-4 py-2 ${msg.role === "user"
                                        ? "bg-amber-600 text-white"
                                        : "bg-zinc-800"
                                    }`}
                            >
                                {msg.agent && (
                                    <div className="text-xs font-medium text-amber-400 mb-1">
                                        🤖 {msg.agent}
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask HIVE-R anything..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
                    disabled={loading}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-medium transition-colors"
                >
                    {loading ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
}
