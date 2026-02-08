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
        <div className="flex h-[calc(100vh-64px)] bg-hive-bg-dark">
            {/* Sidebar */}
            <aside className="w-80 border-r border-white/10 glass-high-contrast">
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
    );
}

export default HistoryPage;
