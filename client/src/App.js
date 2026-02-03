import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * HIVE-R Studio - Main Application
 */
import { useState, useCallback } from 'react';
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';
// ============================================================================
// INITIAL GRAPH DATA
// ============================================================================
const initialNodes = [
    { id: 'Router', position: { x: 300, y: 0 }, data: { label: '🧭 Router' }, type: 'input' },
    { id: 'Founder', position: { x: 50, y: 100 }, data: { label: '👔 Founder' } },
    { id: 'ProductManager', position: { x: 200, y: 100 }, data: { label: '📋 PM' } },
    { id: 'UXResearcher', position: { x: 350, y: 100 }, data: { label: '🔬 UX Researcher' } },
    { id: 'Designer', position: { x: 500, y: 100 }, data: { label: '🎨 Designer' } },
    { id: 'Accessibility', position: { x: 650, y: 100 }, data: { label: '♿ A11y' } },
    { id: 'Planner', position: { x: 50, y: 200 }, data: { label: '📐 Planner' } },
    { id: 'Security', position: { x: 200, y: 200 }, data: { label: '🔒 Security' } },
    { id: 'Builder', position: { x: 350, y: 200 }, data: { label: '🛠️ Builder' } },
    { id: 'Reviewer', position: { x: 500, y: 200 }, data: { label: '👀 Reviewer' } },
    { id: 'Tester', position: { x: 650, y: 200 }, data: { label: '🧪 Tester' } },
    { id: 'TechWriter', position: { x: 50, y: 300 }, data: { label: '✍️ Tech Writer' } },
    { id: 'SRE', position: { x: 200, y: 300 }, data: { label: '🚀 SRE' } },
    { id: 'DataAnalyst', position: { x: 350, y: 300 }, data: { label: '📊 Data Analyst' } },
];
const initialEdges = [
    { id: 'e-router-founder', source: 'Router', target: 'Founder', animated: false },
    { id: 'e-router-pm', source: 'Router', target: 'ProductManager', animated: false },
    { id: 'e-router-ux', source: 'Router', target: 'UXResearcher', animated: false },
    { id: 'e-router-designer', source: 'Router', target: 'Designer', animated: false },
    { id: 'e-router-a11y', source: 'Router', target: 'Accessibility', animated: false },
    { id: 'e-router-planner', source: 'Router', target: 'Planner', animated: false },
    { id: 'e-router-security', source: 'Router', target: 'Security', animated: false },
    { id: 'e-router-builder', source: 'Router', target: 'Builder', animated: false },
    { id: 'e-router-reviewer', source: 'Router', target: 'Reviewer', animated: false },
    { id: 'e-router-tester', source: 'Router', target: 'Tester', animated: false },
    { id: 'e-router-techwriter', source: 'Router', target: 'TechWriter', animated: false },
    { id: 'e-router-sre', source: 'Router', target: 'SRE', animated: false },
    { id: 'e-router-dataanalyst', source: 'Router', target: 'DataAnalyst', animated: false },
    // Direct handoffs
    { id: 'e-designer-builder', source: 'Designer', target: 'Builder', animated: false, style: { stroke: '#22c55e' } },
    { id: 'e-builder-tester', source: 'Builder', target: 'Tester', animated: false, style: { stroke: '#22c55e' } },
    { id: 'e-tester-builder', source: 'Tester', target: 'Builder', animated: false, style: { stroke: '#f59e0b' } },
];
function ChatPanel({ messages, onSend }) {
    const [input, setInput] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onSend(input.trim());
            setInput('');
        }
    };
    return (_jsxs("div", { className: "chat-panel", children: [_jsx("div", { className: "chat-header", children: _jsx("h2", { children: "\uD83D\uDCAC HIVE-R Studio" }) }), _jsx("div", { className: "chat-messages", children: messages.map((msg) => (_jsxs("div", { className: `message ${msg.role}`, children: [msg.agent && _jsx("span", { className: "agent-name", children: msg.agent }), _jsx("p", { children: msg.content })] }, msg.id))) }), _jsxs("form", { className: "chat-input", onSubmit: handleSubmit, children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), placeholder: "What would you like to build?" }), _jsx("button", { type: "submit", children: "Send" })] })] }));
}
// ============================================================================
// MAIN APP
// ============================================================================
function App() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [messages, setMessages] = useState([
        { id: '1', role: 'agent', agent: 'Router', content: 'Welcome to HIVE-R Studio! I coordinate a team of 13 AI specialists. What would you like to build today?' },
    ]);
    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const handleSend = async (content) => {
        // Add user message
        const userMsg = { id: Date.now().toString(), role: 'user', content };
        setMessages((prev) => [...prev, userMsg]);
        // TODO: Call backend API
        // For now, simulate a response
        setTimeout(() => {
            const agentMsg = {
                id: (Date.now() + 1).toString(),
                role: 'agent',
                agent: 'Router',
                content: `I'll route your request to the appropriate team members. Processing: "${content}"`,
            };
            setMessages((prev) => [...prev, agentMsg]);
        }, 500);
    };
    return (_jsxs("div", { className: "app", children: [_jsx(ChatPanel, { messages: messages, onSend: handleSend }), _jsx("div", { className: "graph-panel", children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, fitView: true, children: [_jsx(Controls, {}), _jsx(Background, {})] }) })] }));
}
export default App;
//# sourceMappingURL=App.js.map