"use client";

export default function ThreadsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Threads</h1>
                <p className="text-zinc-400">Browse conversation history</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <span className="text-4xl mb-4 block">📜</span>
                <p className="text-zinc-400">Thread history will appear here.</p>
                <p className="text-zinc-500 text-sm mt-2">
                    Start a conversation in Chat to see threads.
                </p>
            </div>
        </div>
    );
}
