import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import UserBar from './UserBar';
import { useSidebar } from '../context/SidebarContext';
import { sendAiMessage, clearAiConversation, getAuthToken } from '../services/api';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const CURRENT_USER_KEY = 'pollution_current_user';
const SESSIONS_STORAGE_KEY = 'pollution_ai_chat_sessions_v1';

const SUGGESTED_QUERIES = [
  'How many vehicles tested in the month of August?',
  'What was the profit last year?',
  'Show all certificates expiring within the next 30 days.',
  'What is the breakdown of vehicles by fuel type?',
  'Show monthly certificate issuance statistics.',
  'Which vehicles have expired pollution certificates?'
];

const AiChat = () => {
  const { isOpen } = useSidebar();
  const [currentUser, setCurrentUser] = useState('');
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [printData, setPrintData] = useState(null);
  const messagesEndRef = useRef(null);

  // Load user & sessions on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    if (!user) {
      window.location.href = '/';
      return;
    }
    setCurrentUser(user);

    // Load saved chat history sessions
    let savedSessions = [];
    try {
      savedSessions = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY)) || [];
    } catch {
      savedSessions = [];
    }

    if (savedSessions.length > 0) {
      setSessions(savedSessions);
      setActiveSessionId(savedSessions[0].id);
      setMessages(savedSessions[0].messages || []);
    } else {
      // Create fresh default session
      const newSession = createNewSession(user);
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      setMessages(newSession.messages);
      saveSessionsToStorage([newSession]);
    }
  }, []);

  // Save sessions to localStorage whenever messages or sessions change
  const saveSessionsToStorage = (updatedSessions) => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.warn('Could not save chat history to localStorage:', e);
    }
  };

  const createNewSession = (user) => {
    const username = user || currentUser || 'User';
    const id = 'sess_' + Date.now();
    return {
      id,
      title: 'New Conversation',
      createdAt: new Date().toLocaleString(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'init_' + Date.now(),
          role: 'assistant',
          content: `Hello ${username}! I am your AI assistant for the Vehicle Pollution Certificate Management System. Powered locally by Qwen 3 (8B) via Ollama, I can answer your questions about vehicle tests, monthly counts, revenue/profit, expiring certificates, and more. How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
  };

  const handleStartNewChat = () => {
    if (loading) return;
    const newSession = createNewSession(currentUser);
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    setMessages(newSession.messages);
    saveSessionsToStorage(updated);
    setErrorBanner('');
  };

  const handleSelectSession = (sessionId) => {
    if (loading || sessionId === activeSessionId) return;
    const found = sessions.find((s) => s.id === sessionId);
    if (found) {
      setActiveSessionId(found.id);
      setMessages(found.messages || []);
      setErrorBanner('');
    }
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    if (updated.length === 0) {
      const fresh = createNewSession(currentUser);
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      setMessages(fresh.messages);
      saveSessionsToStorage([fresh]);
    } else {
      setSessions(updated);
      saveSessionsToStorage(updated);
      if (activeSessionId === sessionId) {
        setActiveSessionId(updated[0].id);
        setMessages(updated[0].messages || []);
      }
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    setErrorBanner('');
    setInputMessage('');

    const userMsg = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await sendAiMessage(query, activeSessionId);

      const aiMsg = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: response.reply,
        toolCalls: response.toolCalls || [],
        structuredData: response.structuredData || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // Update session title and messages in storage
      const updatedSessions = sessions.map((s) => {
        if (s.id === activeSessionId) {
          const isDefaultTitle = s.title === 'New Conversation';
          const newTitle = isDefaultTitle
            ? query.length > 36 ? query.substring(0, 36) + '...' : query
            : s.title;
          return {
            ...s,
            title: newTitle,
            updatedAt: Date.now(),
            messages: finalMessages
          };
        }
        return s;
      });

      setSessions(updatedSessions);
      saveSessionsToStorage(updatedSessions);
    } catch (err) {
      console.error('Failed to get AI response:', err);
      const errorMessage = err.message || 'An error occurred while communicating with the AI assistant.';
      setErrorBanner(errorMessage);

      const errorMsg = {
        id: 'err_' + Date.now(),
        role: 'system_error',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, errorMsg];
      setMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (loading) return;
    try {
      await clearAiConversation(activeSessionId);
    } catch {
      // Ignore cleanup error
    }
    const freshMessages = [
      {
        id: 'init_' + Date.now(),
        role: 'assistant',
        content: `Conversation reset. Feel free to ask a new question!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(freshMessages);
    setErrorBanner('');

    const updatedSessions = sessions.map((s) =>
      s.id === activeSessionId ? { ...s, messages: freshMessages, updatedAt: Date.now() } : s
    );
    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // PDF Printing functions
  const handlePrintSingleResult = (aiMsg, userQuery) => {
    setPrintData({
      type: 'single',
      query: userQuery || 'Query Analysis',
      aiMsg,
      timestamp: new Date().toLocaleString(),
      user: currentUser
    });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintFullChat = () => {
    setPrintData({
      type: 'full',
      messages,
      timestamp: new Date().toLocaleString(),
      user: currentUser
    });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Render structured data visualization (table / cards)
  const renderStructuredData = (data) => {
    if (!data) return null;

    // 1. Financial statistics (Revenue / Profit)
    if (data.total_revenue !== undefined) {
      return (
        <div style={styles.dataCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: '1px solid #e0e0e0', paddingBottom: 8 }}>
            <div style={{ background: '#e8f5e9', padding: 6, borderRadius: '50%', display: 'flex' }}>
              <AttachMoneyIcon style={{ color: '#2e7d32', fontSize: 22 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1b5e20' }}>
                Financial Overview & Collections
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Period: {data.start_date} to {data.end_date}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ background: '#ffffff', border: '1px solid #c8e6c9', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Total Revenue / Profit</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#2e7d32', marginTop: 4 }}>
                ₹{Number(data.total_revenue).toLocaleString()}
              </div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #bbdefb', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Vehicles Tested</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1565c0', marginTop: 4 }}>
                {data.vehicles_tested}
              </div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #ffe0b2', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Average Fee / Test</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e65100', marginTop: 4 }}>
                ₹{data.average_fee_per_vehicle}
              </div>
            </div>
          </div>

          {/* Breakdown by vehicle type */}
          {data.revenue_by_vehicle_type && data.revenue_by_vehicle_type.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
                Collections by Vehicle Type:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.revenue_by_vehicle_type.map((item, idx) => (
                  <span key={idx} style={{ background: '#ffffff', border: '1px solid #ddd', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#333' }}>
                    <strong>{item.type}:</strong> ₹{Number(item.amount).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 2. Expiring or expired certificates table
    if (data.expiring_certificates || data.expired_certificates) {
      const list = [
        ...(data.expiring_certificates || []).map((c) => ({ ...c, status: 'Expiring Soon' })),
        ...(data.expired_certificates || []).map((c) => ({ ...c, status: 'Expired' }))
      ];

      if (list.length === 0) {
        return (
          <div style={styles.dataCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2e7d32' }}>
              <CheckCircleOutlineIcon fontSize="small" />
              <span>No certificates currently expired or expiring within {data.expiring_within_days} days.</span>
            </div>
          </div>
        );
      }

      return (
        <div style={styles.dataCard}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
            <WarningAmberIcon fontSize="small" style={{ color: '#ed6c02' }} />
            <span>Certificate Expiration Summary ({list.length} records)</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Vehicle Number</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Fuel</th>
                  <th style={styles.th}>Expiry Date</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 10).map((item, idx) => (
                  <tr key={idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}><strong>{item.vehicleNumber}</strong></td>
                    <td style={styles.td}>{item.vehicleType}</td>
                    <td style={styles.td}>{item.fuelType}</td>
                    <td style={styles.td}>{item.expiryDate}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: item.status === 'Expired' ? '#ffebee' : '#fff3e0',
                          color: item.status === 'Expired' ? '#c62828' : '#e65100'
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length > 10 && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 6, fontStyle: 'italic' }}>
              Showing first 10 of {list.length} records.
            </div>
          )}
        </div>
      );
    }

    // 3. Breakdown table (fuelType or vehicleType)
    if (data.breakdown && Array.isArray(data.breakdown)) {
      const total = data.total_records || 1;
      return (
        <div style={styles.dataCard}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>
            📊 Breakdown by {data.group_by === 'fuelType' ? 'Fuel Type' : 'Vehicle Type'} (Total: {data.total_records})
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Count</th>
                  <th style={styles.th}>Share</th>
                  <th style={styles.th}>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((row, idx) => {
                  const pct = Math.round((row.count / total) * 100);
                  return (
                    <tr key={idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                      <td style={styles.td}><strong>{row.category}</strong></td>
                      <td style={styles.td}>{row.count}</td>
                      <td style={styles.td}>{pct}%</td>
                      <td style={styles.td}>
                        <div style={{ width: 120, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#1976d2' }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 4. Periodic statistics
    if (data.statistics && Array.isArray(data.statistics)) {
      return (
        <div style={styles.dataCard}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>
            📈 Issuance Statistics ({data.grouping}) — Total: {data.total_certificates} (Avg: {data.average_per_period}/period)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Period</th>
                  <th style={styles.th}>Certificates Issued</th>
                </tr>
              </thead>
              <tbody>
                {data.statistics.map((row, idx) => (
                  <tr key={idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}><strong>{row.period}</strong></td>
                    <td style={styles.td}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 5. Vehicle search results
    if (data.vehicles && Array.isArray(data.vehicles)) {
      if (data.vehicles.length === 0) return null;
      return (
        <div style={styles.dataCard}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
            <DirectionsCarIcon fontSize="small" style={{ color: '#1976d2' }} />
            <span>Matching Vehicles ({data.vehicles.length})</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Registration</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Fuel</th>
                  <th style={styles.th}>Fee (₹)</th>
                  <th style={styles.th}>Issued On</th>
                  <th style={styles.th}>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {data.vehicles.map((v, idx) => (
                  <tr key={idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}><strong>{v.vehicleNumber}</strong></td>
                    <td style={styles.td}>{v.vehicleType}</td>
                    <td style={styles.td}>{v.fuelType}</td>
                    <td style={styles.td}>₹{v.amount}</td>
                    <td style={styles.td}>{v.dateOfEntry}</td>
                    <td style={styles.td}>{v.expiryDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          marginLeft: isOpen ? 250 : 70,
          minHeight: '100vh',
          background: '#fafbfc',
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <UserBar />

        {/* Content Area */}
        <div style={{ flex: 1, padding: '20px 32px 32px 32px', maxWidth: 1050, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header Banner */}
          <div style={styles.headerBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={styles.headerIconWrapper}>
                <SmartToyIcon style={{ color: '#f5b800', fontSize: 32 }} />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#222' }}>
                  AI Data Assistant
                </h1>
                <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>
                  Real-time analytics & queries powered by local <strong>Qwen 3 (8B)</strong> via Ollama.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{ ...styles.actionBtn, background: showHistory ? '#e3f2fd' : '#ffffff', color: showHistory ? '#1976d2' : '#555' }}
                title="Toggle Saved Chat History"
              >
                <HistoryIcon fontSize="small" />
                <span>History ({sessions.length})</span>
              </button>

              <button
                onClick={handleStartNewChat}
                style={{ ...styles.actionBtn, background: '#1976d2', color: '#ffffff', border: 'none' }}
                title="Start a new conversation"
              >
                <AddIcon fontSize="small" />
                <span>New Chat</span>
              </button>

              <button
                onClick={handlePrintFullChat}
                style={styles.actionBtn}
                title="Print entire conversation into PDF"
              >
                <PictureAsPdfIcon fontSize="small" style={{ color: '#d32f2f' }} />
                <span>Print PDF</span>
              </button>

              <button
                onClick={handleClearChat}
                style={styles.actionBtn}
                title="Clear current messages"
              >
                <DeleteOutlineIcon fontSize="small" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* History Drawer / Panel */}
          {showHistory && (
            <div style={styles.historyPanel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>
                  📁 Saved Conversations
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888' }}
                >
                  Close ✕
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    style={{
                      ...styles.historyItem,
                      background: s.id === activeSessionId ? '#e3f2fd' : '#ffffff',
                      borderColor: s.id === activeSessionId ? '#90caf9' : '#e0e0e0'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#333', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                        {s.createdAt} • {s.messages?.length || 0} messages
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      style={styles.historyDeleteBtn}
                      title="Delete conversation"
                    >
                      <DeleteOutlineIcon style={{ fontSize: 16 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorBanner && (
            <div style={styles.errorAlert}>
              <WarningAmberIcon style={{ color: '#d32f2f', marginRight: 8 }} />
              <div style={{ flex: 1, fontSize: 14 }}>{errorBanner}</div>
            </div>
          )}

          {/* Suggested Prompts */}
          {messages.length <= 2 && (
            <div style={styles.suggestionsContainer}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#777', marginBottom: 8 }}>
                💡 Suggested questions:
              </div>
              <div style={styles.chipWrap}>
                {SUGGESTED_QUERIES.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={loading}
                    style={styles.suggestionChip}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages Box */}
          <div style={styles.chatBox}>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isError = msg.role === 'system_error';
              // Find the corresponding user query for this assistant message (the immediately preceding user message)
              const previousUserMsg = !isUser && index > 0 && messages[index - 1]?.role === 'user' ? messages[index - 1].content : '';

              return (
                <div
                  key={msg.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    marginBottom: 16
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      borderRadius: 12,
                      padding: '14px 18px',
                      background: isUser ? '#1976d2' : isError ? '#ffebee' : '#ffffff',
                      color: isUser ? '#ffffff' : isError ? '#c62828' : '#222222',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      border: isUser ? 'none' : isError ? '1px solid #ffcdd2' : '1px solid #f0f0f0',
                      lineHeight: 1.55,
                      fontSize: 15,
                      whiteSpace: 'pre-wrap',
                      position: 'relative'
                    }}
                  >
                    {/* Tool Badges */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {msg.toolCalls.map((tc, tidx) => (
                          <span key={tidx} style={styles.toolBadge}>
                            <BuildCircleIcon style={{ fontSize: 13, marginRight: 4 }} />
                            Tool: {tc.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Message Content */}
                    <div>{msg.content}</div>

                    {/* Structured Table/Cards */}
                    {msg.structuredData && renderStructuredData(msg.structuredData)}

                    {/* Footer bar inside message: timestamp & print button */}
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: isUser ? 'rgba(255,255,255,0.75)' : '#999',
                        borderTop: isUser ? 'none' : '1px solid #f5f5f5',
                        paddingTop: 6
                      }}
                    >
                      <span>{msg.timestamp}</span>

                      {/* Print PDF button on assistant replies */}
                      {!isUser && !isError && (
                        <button
                          onClick={() => handlePrintSingleResult(msg, previousUserMsg)}
                          style={styles.printSingleBtn}
                          title="Print this result as a PDF report"
                        >
                          <PictureAsPdfIcon style={{ fontSize: 13, color: '#d32f2f' }} />
                          <span>Print to PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
                <div style={styles.aiAvatar}>
                  <SmartToyIcon style={{ fontSize: 18, color: '#f5b800' }} />
                </div>
                <div style={styles.typingBubble}>
                  <span style={styles.dot}>●</span>
                  <span style={{ ...styles.dot, animationDelay: '0.2s' }}>●</span>
                  <span style={{ ...styles.dot, animationDelay: '0.4s' }}>●</span>
                  <span style={{ marginLeft: 8, fontSize: 13, color: '#666' }}>Qwen 3 (8B) is querying data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={styles.inputBarContainer}>
            <input
              type="text"
              className="chat-input-field"
              placeholder="Ask anything (e.g. 'How many vehicles tested in August?', 'What was the profit last year?')..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={styles.chatInput}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputMessage.trim()}
              style={{
                ...styles.sendButton,
                opacity: loading || !inputMessage.trim() ? 0.6 : 1,
                cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              <SendIcon fontSize="small" />
              <span>Send</span>
            </button>
          </div>

          <footer style={{ marginTop: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>
            Pollution Data Manager © 2026 • Local AI Inference on Ollama (Qwen 3 8B)
          </footer>
        </div>
      </div>

      {/* Hidden container for printing to PDF */}
      <div id="printable-report" style={{ display: 'none' }}>
        {printData && (
          <div style={{ fontFamily: 'Arial, sans-serif', color: '#222', padding: 24 }}>
            {/* Header */}
            <div style={{ borderBottom: '2px solid #1976d2', paddingBottom: 12, marginBottom: 16 }}>
              <h1 style={{ margin: 0, fontSize: 22, color: '#1976d2' }}>
                Pollution Testing Center — AI Analysis Report
              </h1>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                Generated on: {printData.timestamp} | User: {printData.user} | Engine: Local Qwen 3 (8B)
              </div>
            </div>

            {/* Single query print */}
            {printData.type === 'single' && (
              <div>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>User Question:</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1976d2', marginTop: 4 }}>
                    {printData.query}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 6 }}>Assistant Analysis:</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {printData.aiMsg.content}
                  </div>
                </div>

                {printData.aiMsg.structuredData && (
                  <div style={{ marginTop: 16 }}>
                    {renderStructuredData(printData.aiMsg.structuredData)}
                  </div>
                )}
              </div>
            )}

            {/* Full conversation print */}
            {printData.type === 'full' && (
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Conversation Transcript</h3>
                {printData.messages.map((m, idx) => (
                  <div key={idx} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #eee' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: m.role === 'user' ? '#1976d2' : '#2e7d32' }}>
                      {m.role === 'user' ? `User (${m.timestamp})` : `AI Assistant (${m.timestamp})`}
                    </div>
                    <div style={{ fontSize: 14, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                      {m.content}
                    </div>
                    {m.structuredData && (
                      <div style={{ marginTop: 10 }}>
                        {renderStructuredData(m.structuredData)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Print Footer */}
            <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #ddd', fontSize: 11, color: '#888', textAlign: 'center' }}>
              Vehicle Pollution Certificate Management System • Confidential Official Record
            </div>
          </div>
        )}
      </div>

      {/* Global CSS for Print Mode and Input Styling */}
      <style>{`
        .chat-input-field {
          background-color: #ffffff !important;
          color: #000000 !important;
          caret-color: #000000 !important;
        }
        .chat-input-field::placeholder {
          color: #666666 !important;
          opacity: 1 !important;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report, #printable-report * {
            visibility: visible !important;
            display: block !important;
          }
          #printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  headerBanner: {
    background: 'linear-gradient(90deg, #fffde7 50%, #e3f2fd 100%)',
    borderRadius: 12,
    padding: '18px 24px',
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    border: '1px solid #fff9c4',
    flexWrap: 'wrap',
    gap: 12
  },
  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#ffffff',
    border: '1px solid #ddd',
    color: '#555',
    borderRadius: 6,
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  historyPanel: {
    background: '#ffffff',
    border: '1px solid #bbdefb',
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  historyDeleteBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    marginLeft: 8
  },
  errorAlert: {
    background: '#ffebee',
    border: '1px solid #ffcdd2',
    color: '#c62828',
    padding: '10px 16px',
    borderRadius: 8,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center'
  },
  suggestionsContainer: {
    background: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: 12,
    padding: '14px 18px',
    marginBottom: 16
  },
  chipWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  suggestionChip: {
    background: '#f8f9fa',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 13,
    color: '#1976d2',
    cursor: 'pointer',
    fontWeight: 500,
    textAlign: 'left'
  },
  chatBox: {
    flex: 1,
    minHeight: 420,
    maxHeight: 'calc(100vh - 360px)',
    overflowY: 'auto',
    background: '#ffffff',
    borderRadius: 12,
    border: '1px solid #f0f0f0',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#fffde7',
    border: '1px solid #fff59d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  typingBubble: {
    background: '#f8f9fa',
    border: '1px solid #eee',
    borderRadius: 16,
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  dot: {
    color: '#1976d2',
    fontSize: 10
  },
  toolBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#e3f2fd',
    color: '#1565c0',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 600
  },
  printSingleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: '#f5f5f5',
    border: '1px solid #e0e0e0',
    color: '#555',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer'
  },
  inputBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    background: '#ffffff',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: '6px 10px',
    border: '2px solid #000000',
    boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
  },
  chatInput: {
    flex: 1,
    background: '#ffffff',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: 'none',
    outline: 'none',
    fontSize: 15,
    fontWeight: 500,
    padding: '10px 12px',
    fontFamily: 'inherit'
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 18px',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.2s'
  },
  dataCard: {
    marginTop: 12,
    background: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: 8,
    padding: 12
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    marginTop: 6
  },
  th: {
    background: '#e9ecef',
    padding: '8px 10px',
    textAlign: 'left',
    color: '#495057',
    fontWeight: 600,
    borderBottom: '2px solid #dee2e6'
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #eee',
    color: '#333'
  },
  trEven: {
    background: '#ffffff'
  },
  trOdd: {
    background: '#fafafa'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600
  }
};

export default AiChat;
