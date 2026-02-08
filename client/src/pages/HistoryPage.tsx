/**
 * History Page
 * 
 * Browse past conversations with sidebar and detail view.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionList } from '../components/SessionList';
import { SessionDetail } from '../components/SessionDetail';

export function HistoryPage() {
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleNewChat = () => {
        navigate('/app');
    };

    const handleResume = (sessionId: string) => {
        navigate(`/app?session=${sessionId}`);
    };

    return (
        <div className="min-h-screen bg-void-950 pt-24 pb-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex h-[calc(100vh-160px)] bg-void-900/40 backdrop-blur-xl border border-white/6 rounded-2xl overflow-hidden">
                    {/* Sidebar */}
                    <aside className="w-80 border-r border-white/6 bg-void-900/60">
                        <SessionList
                            selectedId={selectedSessionId}
                            onSelectSession={setSelectedSessionId}
                            onNewChat={handleNewChat}
                        />
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 flex flex-col">
                        <SessionDetail
                            sessionId={selectedSessionId}
                            onResume={handleResume}
                        />
                    </main>
                </div>
            </div>
        </div>
    );
}

export default HistoryPage;
