import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { useUser } from './usercontext';
import { AGENT_BASE_URL, API_BASE_URL, AGENT_MODEL } from './config';

const defaultIntro = {
  role: 'assistant',
  text: 'Hi! I can plan events with your friends. Tell me who, when, how long, and where, and I will propose slots.',
  at: new Date().toISOString(),
};

const sessionKey = (userId) => `planner-session-${userId || 'guest'}`;

const messageTime = (message) => {
  if (message?.created_at) return new Date(message.created_at).getTime();
  const fallback = Number(message?.message_id);
  return Number.isFinite(fallback) ? fallback : 0;
};

const initialLetters = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

const formatInviteDetails = (payload) => {
  if (!payload) return null;
  const date = payload.date || (Array.isArray(payload.dates) ? payload.dates[0] : payload.dates);
  if (!date || !payload.startTime || !payload.endTime) return null;
  return `${payload.name || 'Event'} on ${date} at ${payload.startTime}-${payload.endTime}`;
};

const formatMessageContent = ({ message, fromSelf, fallbackName }) => {
  if (!message) return '';
  if (message.type === 'friend_request') {
    return fromSelf
      ? `You sent a friend request to ${fallbackName}`
      : `${fallbackName} requested to follow you`;
  }
  if (message.type === 'event_invite' || message.type === 'event_edit') {
    const details = formatInviteDetails(message.payload);
    return fromSelf
      ? `You sent an ${message.type === 'event_edit' ? 'edit request' : 'event invite'} to ${fallbackName}${
          details ? `: ${details}` : ''
        }`
      : `${fallbackName} sent you an ${message.type === 'event_edit' ? 'edit request' : 'event invite'}${
          details ? `: ${details}` : ''
        }`;
  }
  return message.content || '';
};

export default function AiPlannerPanel({ isOpen, onToggle }) {
  const { state, dispatch } = useUser();
  const [aiInput, setAiInput] = useState('');
  const [directInput, setDirectInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingDirect, setSendingDirect] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [actions, setActions] = useState([]);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const helpRef = useRef(null);
  const [activeThread, setActiveThread] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);

  useEffect(() => {
    if (state.id && state.systemAgent?.id) {
      setActiveThread(String(state.systemAgent.id));
    }
  }, [state.id, state.systemAgent]);

  useEffect(() => {
    if (!state.id) {
      setSessionId(null);
      return;
    }
    const saved = window.localStorage.getItem(sessionKey(state.id));
    if (saved) {
      setSessionId(saved);
    }
  }, [state.id]);

  useEffect(() => {
    if (!showHelp) return undefined;
    const handleClickOutside = (event) => {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelp(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHelp]);

  const aiMessagesEndRef = useRef(null);

  const directMessagesEndRef = useRef(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const sendAiMessage = async (text, options = {}) => {
    if (!text.trim() || !state.id || !state.systemAgent?.id) return;
    const { suppressUserMessage = false, suppressAgentMessage = false, markInviteSent = false } =
      options;
    setAiInput('');
    setLoading(true);
    setError('');
    setRequiresConfirmation(false);
    try {
      const token =
        window.localStorage.getItem('token') ||
        window.localStorage.getItem('authToken') ||
        window.localStorage.getItem('jwt');

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        const clean = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        headers.Authorization = clean;
      }

      const agentId = state.systemAgent.id;
      if (!suppressUserMessage) {
        const userMessageResponse = await fetch(
          `${API_BASE_URL}/api/social/${state.id}/${agentId}/send-message`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'message',
              content: text.trim(),
            }),
          }
        );
        const userMessageData = await userMessageResponse.json();
        if (userMessageData.success && userMessageData.message) {
          dispatch({ type: 'APPEND_CONTEXT', payload: { inbox: [userMessageData.message] } });
        }
      }

      const response = await fetch(`${AGENT_BASE_URL}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: state.id,
          message: text.trim(),
          sessionId: sessionId || undefined,
          clientTimeISO: new Date().toISOString(),
          timezone,
          appBaseUrl: window.location.origin,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent returned ${response.status}`);
      }

      const data = await response.json();
      const nextSessionId = data.sessionId || sessionId;
      setSessionId(nextSessionId);
      if (state.id && nextSessionId) {
        window.localStorage.setItem(sessionKey(state.id), nextSessionId);
      }
      setActions(Array.isArray(data.actions) ? data.actions : []);
      setRequiresConfirmation(Boolean(data.requiresConfirmation));

      const replyText = data.replyText || 'I could not generate a reply right now.';
      let agentMessage = null;
      if (!suppressAgentMessage) {
        const agentMessageResponse = await fetch(
          `${API_BASE_URL}/api/social/${agentId}/${state.id}/send-message`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'message',
              content: replyText,
            }),
          }
        );
        const agentMessageData = await agentMessageResponse.json();
        if (agentMessageData.success && agentMessageData.message) {
          agentMessage = agentMessageData.message;
          dispatch({ type: 'APPEND_CONTEXT', payload: { inbox: [agentMessageData.message] } });
        }
      }

      if (markInviteSent) {
        setPendingInvite((prev) =>
          prev
            ? {
                ...prev,
                status: 'sent',
                sentText: replyText,
              }
            : prev
        );
      } else if (data.requiresConfirmation && agentMessage) {
        setPendingInvite({
          messageId: agentMessage.message_id,
          status: 'ready',
          replyText,
          sentText: null,
        });
      } else if (!data.requiresConfirmation) {
        setPendingInvite(null);
      }
    } catch (err) {
      console.error('AI planner error', err);
      setError('Agent is unavailable. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiSubmit = (e) => {
    e.preventDefault();
    sendAiMessage(aiInput);
  };

  const friendMap = useMemo(() => {
    const map = new Map();
    (state.friends || []).forEach((friend) => {
      map.set(Number(friend.id), friend);
    });
    return map;
  }, [state.friends]);

  const inboxMessages = useMemo(() => (state.inbox || []).slice(), [state.inbox]);

  const agentId = state.systemAgent?.id ? Number(state.systemAgent.id) : null;
  const agentName = state.systemAgent?.username || 'Cloudflare Agent';
  const modelLabel = AGENT_MODEL;

  const agentConversation = useMemo(() => {
    if (!agentId || !state.id) return [];
    const thread = inboxMessages
      .filter((message) => {
        const senderId = Number(message.sender_id);
        const recipientId = Number(message.recipient_id);
        return (
          (senderId === agentId && recipientId === Number(state.id)) ||
          (senderId === Number(state.id) && recipientId === agentId)
        );
      })
      .sort((a, b) => messageTime(a) - messageTime(b));

    if (thread.length === 0) {
      return [
        {
          message_id: 'intro',
          sender_id: agentId,
          recipient_id: state.id,
          content: defaultIntro.text,
          created_at: defaultIntro.at,
          type: 'message',
          status: 'read',
          sender_username: agentName,
        },
      ];
    }

    return thread;
  }, [agentId, inboxMessages, state.id, agentName]);

  useEffect(() => {
    if (!agentId || !activeThread || Number(activeThread) !== Number(agentId)) return;
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentConversation, loading, activeThread, agentId]);

  const agentLastMessageAt = useMemo(() => {
    if (!agentConversation.length) return 0;
    return messageTime(agentConversation[agentConversation.length - 1]);
  }, [agentConversation]);

  const threads = useMemo(() => {
    const threadMap = new Map();

    const upsertThread = (id, data) => {
      if (!threadMap.has(id)) {
        threadMap.set(id, {
          id,
          type: 'friend',
          name: data.name || 'Unknown',
          lastMessageAt: 0,
          lastMessageText: '',
          unreadCount: 0,
        });
      }
      const existing = threadMap.get(id);
      threadMap.set(id, { ...existing, ...data });
    };

    (state.friends || [])
      .filter((friend) => Number(friend.id) !== Number(state.id))
      .forEach((friend) => {
        upsertThread(Number(friend.id), { name: friend.username });
      });

    inboxMessages.forEach((message) => {
      const senderId = Number(message.sender_id);
      const recipientId = Number(message.recipient_id);
      const otherId = senderId === Number(state.id) ? recipientId : senderId;
      if (agentId && Number(otherId) === Number(agentId)) return;
      if (!otherId) return;

      const friend = friendMap.get(otherId);
      const fromSelf = Number(message.sender_id) === Number(state.id);
      const otherUsername = fromSelf ? message.recipient_username : message.sender_username;
      const fallbackName =
        friend?.username ||
        otherUsername ||
        String(message.content || '').split(' ')[0] ||
        'Unknown';

      upsertThread(otherId, { name: fallbackName });

      const current = threadMap.get(otherId);
      const displayText = formatMessageContent({
        message,
        fromSelf,
        fallbackName,
      });
      const timeValue = messageTime(message);
      const newLast =
        !current.lastMessageAt || timeValue >= current.lastMessageAt
          ? {
              lastMessageAt: timeValue,
              lastMessageText: displayText || message.content || '',
            }
          : {};

      const unread =
        Number(message.recipient_id) === Number(state.id) && message.status === 'unread'
          ? 1
          : 0;

      threadMap.set(otherId, {
        ...current,
        ...newLast,
        unreadCount: (current.unreadCount || 0) + unread,
      });
    });

    const threadsArray = [
      ...(agentId
        ? [
            {
              id: agentId,
              type: 'agent',
              name: agentName,
              lastMessageAt: agentLastMessageAt,
              lastMessageText:
                agentConversation[agentConversation.length - 1]?.content || 'Ready to plan.',
              unreadCount: 0,
            },
          ]
        : []),
      ...Array.from(threadMap.values()),
    ];

    return threadsArray.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  }, [
    state.friends,
    state.id,
    inboxMessages,
    friendMap,
    agentLastMessageAt,
    agentId,
    agentName,
    agentConversation,
  ]);

  useEffect(() => {
    if (!threads.length) return;
    const exists = threads.some((thread) => String(thread.id) === String(activeThread));
    if (!exists && threads[0]) setActiveThread(String(threads[0].id));
  }, [threads, activeThread]);

  useEffect(() => {
    if (!activeThread || !state.id) return;
    const threadId = Number(activeThread);
    if (!Number.isFinite(threadId)) return;

    const markRead = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/social/${state.id}/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ other_id: threadId }),
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.messages)) {
          data.messages.forEach((message) => {
            dispatch({ type: 'UPDATE_INBOX', payload: message });
          });
        }
      } catch (err) {
        console.error('Failed to mark messages read', err);
      }
    };

    markRead();
  }, [activeThread, state.id, dispatch]);

  const activeFriendId =
    activeThread && agentId && Number(activeThread) !== Number(agentId)
      ? Number(activeThread)
      : null;
  const isFriendActive =
    activeFriendId !== null &&
    (state.friends || []).some((friend) => Number(friend.id) === activeFriendId);

  const friendName =
    activeFriendId && friendMap.get(activeFriendId)?.username
      ? friendMap.get(activeFriendId).username
      : 'Friend';

  const conversation = useMemo(() => {
    if (!activeFriendId) return [];
    return inboxMessages
      .filter((message) => {
        const senderId = Number(message.sender_id);
        const recipientId = Number(message.recipient_id);
        return (
          (senderId === activeFriendId && recipientId === Number(state.id)) ||
          (senderId === Number(state.id) && recipientId === activeFriendId)
        );
      })
      .sort((a, b) => messageTime(a) - messageTime(b));
  }, [activeFriendId, inboxMessages, state.id]);

  useEffect(() => {
    if (!activeThread || (agentId && Number(activeThread) === agentId)) return;
    directMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, activeThread, agentId]);

  const handleActRequest = async (action, message) => {
    const optimistic = { ...message, status: `${action}ed` };
    dispatch({ type: 'UPDATE_INBOX', payload: optimistic });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/social/${state.id}/${message.sender_id}/update-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ request: message, action, recipient_username: state.username }),
        }
      );

      const data = await response.json();

      if (data.success && data.message) {
        dispatch({ type: 'UPDATE_INBOX', payload: data.message });
      }

      if (data.success && action === 'accept' && message.type === 'friend_request') {
        const username =
          data.message?.sender_username ||
          message.sender_username ||
          String(message.content || '').split(' ')[0];
        dispatch({
          type: 'APPEND_CONTEXT',
          payload: { friends: [{ id: message.sender_id, username }] },
        });
      }

      if (message.type === 'event_invite' || message.type === 'event_edit') {
        // Event updates arrive via websocket event_update notifications.
      }

      // No follow-up chat message needed; the status badge communicates the outcome.
    } catch (error) {
      console.error('Error with request:', error);
      dispatch({ type: 'UPDATE_INBOX', payload: message });
    }
  };

  const sendDirectMessage = async () => {
    if (!directInput.trim() || !activeFriendId || !state.id) return;
    setSendingDirect(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/social/${state.id}/${activeFriendId}/send-message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'message', content: directInput.trim() }),
        }
      );
      const data = await response.json();
      if (data.success && data.message) {
        dispatch({ type: 'APPEND_CONTEXT', payload: { inbox: [data.message] } });
      }
      setDirectInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingDirect(false);
    }
  };

  const renderActions = () => {
    if (!actions.length) return null;
    const filtered = actions.filter((action) => {
      const value = String(action.value || action.label || '').toLowerCase();
      return !value.startsWith('option ');
    });

    return (
      <div className="ai-actions">
        {filtered.map((action) => (
          <Button
            key={action.value || action.label}
            size="sm"
            variant="outline-info"
            className="ai-action-button"
            onClick={() => sendAiMessage(action.value || action.label)}
          >
            {action.label || action.value}
            {action.hint && <span className="ai-action-hint">{action.hint}</span>}
          </Button>
        ))}
      </div>
    );
  };

  const closedTab = !isOpen && (
    <button className="ai-panel-tab" onClick={() => onToggle(true)}>
      Messages
    </button>
  );

  return (
    <div className={`ai-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="ai-panel-header">
        <div>
          <div className="ai-panel-title">Messages</div>
          <div className="ai-panel-subtitle">DMs + planner</div>
        </div>
        <div className="ai-panel-controls">
          {loading && <Spinner animation="border" size="sm" role="status" />}
          <Button variant="outline-secondary" size="sm" onClick={() => onToggle(!isOpen)}>
            {isOpen ? 'Close' : 'Open'}
          </Button>
        </div>
      </div>

      {!isOpen && closedTab}

      {isOpen && (
        <>
          {!state.id ? (
            <div className="ai-panel-locked">
              <p>Log in to chat with the planner and your friends.</p>
            </div>
          ) : (
            <div className="dm-shell">
              <aside className="dm-sidebar">
                <div className="dm-thread-list">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      className={`dm-thread ${thread.type === 'agent' ? 'ai' : ''} ${String(activeThread) === String(thread.id) ? 'active' : ''}`}
                      onClick={() => setActiveThread(thread.id)}
                      title={thread.name}
                      aria-label={thread.name}
                    >
                      <div className="dm-thread-avatar">{initialLetters(thread.name)}</div>
                      {thread.type === 'agent' && <span className="dm-thread-ai">AI</span>}
                      {thread.unreadCount > 0 && (
                        <span className="dm-thread-badge">{thread.unreadCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              </aside>
              <section className="dm-conversation">
                {agentId && Number(activeThread) === Number(agentId) ? (
                  <>
                    <div className="dm-header">
                      <div className="dm-title">
                        <span className="agent-model-banner">{modelLabel}</span>
                      </div>
                      <div className="dm-subtitle">AI planner</div>
                    </div>
                    <div className="dm-messages">
                      {agentConversation.map((msg) => {
                        const fromSelf = Number(msg.sender_id) === Number(state.id);
                        const isPendingInvite =
                          pendingInvite &&
                          String(pendingInvite.messageId) === String(msg.message_id);
                        const inviteStatus = isPendingInvite ? pendingInvite.status : null;
                        const inviteText =
                          isPendingInvite && pendingInvite.replyText
                            ? pendingInvite.replyText.replace(/Tap Confirm[^.]*\.?/i, '').trim()
                            : msg.content;
                        const sentText =
                          isPendingInvite && pendingInvite.sentText ? pendingInvite.sentText : null;

                        return (
                          <div
                            key={msg.message_id}
                            className={`dm-bubble ${fromSelf ? 'outgoing' : 'incoming'}`}
                          >
                            {isPendingInvite && (
                              <div className="dm-badge">
                                {inviteStatus === 'sent' ? 'Invite sent' : 'Event ready'}
                              </div>
                            )}
                            <div className="dm-bubble-text">
                              {inviteStatus === 'sent' && sentText ? sentText : inviteText}
                            </div>
                            <div className="dm-bubble-meta">
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ' '}
                            </div>
                            {isPendingInvite && inviteStatus === 'ready' && (
                              <div className="dm-request-actions">
                                <button
                                  className="dm-action accept"
                                  onClick={() =>
                                    sendAiMessage('send it', {
                                      suppressUserMessage: true,
                                      suppressAgentMessage: true,
                                      markInviteSent: true,
                                    })
                                  }
                                  disabled={loading}
                                >
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {loading && (
                        <div className="dm-bubble incoming">
                          <div className="dm-bubble-text muted">Thinking...</div>
                        </div>
                      )}
                      <div ref={aiMessagesEndRef} />
                    </div>
                    {renderActions()}
                    {error && <div className="ai-error">{error}</div>}
                    <Form onSubmit={handleAiSubmit} className="ai-input-form">
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Ask the planner..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        disabled={!state.id || loading}
                      />
                      <div className="ai-input-actions" ref={helpRef}>
                        <button
                          type="button"
                          className="ai-info-button"
                          onClick={() => setShowHelp((prev) => !prev)}
                          aria-label="Planner help"
                        >
                          i
                        </button>
                        {showHelp && (
                          <div className="ai-help-popover">
                            <div className="ai-help-title">Try asking me to:</div>
                            <ul>
                              <li>Add an event to the Calendar</li>
                              <li>Invite friends to an event</li>
                              <li>Edit or reschedule an existing event</li>
                            </ul>
                          </div>
                        )}
                        <Button type="submit" disabled={loading || !aiInput.trim() || !state.id}>
                          {loading ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                    </Form>
                  </>
                ) : (
                  <>
                    <div className="dm-header">
                      <div className="dm-title">
                        {friendMap.get(activeFriendId)?.username || 'Direct message'}
                      </div>
                      <div className="dm-subtitle">
                        {isFriendActive ? 'Friend' : 'Pending connection'}
                      </div>
                    </div>
                    <div className="dm-messages">
                      {conversation.length === 0 && (
                        <div className="dm-empty">No messages yet. Say hello!</div>
                      )}
                      {conversation.map((message) => {
                        const fromSelf = Number(message.sender_id) === Number(state.id);
                        const isRequest =
                          message.type === 'friend_request' ||
                          message.type === 'event_invite' ||
                          message.type === 'event_edit';
                        const canRespond =
                          !fromSelf &&
                          isRequest &&
                          ['unread', 'pending', 'read', undefined, null].includes(message.status);
                        const friendName =
                          friendMap.get(activeFriendId)?.username ||
                          (fromSelf ? message.recipient_username : message.sender_username) ||
                          'Friend';
                        const displayText = formatMessageContent({
                          message,
                          fromSelf,
                          fallbackName: friendName,
                        });

                        return (
                          <div
                            key={message.message_id}
                            className={`dm-bubble ${fromSelf ? 'outgoing' : 'incoming'}`}
                          >
                            {isRequest && (
                              <div className="dm-badge">
                                {message.type === 'friend_request'
                                  ? 'Friend request'
                                  : message.type === 'event_edit'
                                    ? 'Event edit'
                                    : 'Event invite'}
                              </div>
                            )}
                            <div className="dm-bubble-text">{displayText}</div>
                            <div className="dm-bubble-meta">
                              {message.created_at
                                ? new Date(message.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ' '}
                              {!canRespond && isRequest && message.status && (
                                <span className={`dm-status ${message.status}`}>{message.status}</span>
                              )}
                            </div>
                            {canRespond && (
                              <div className="dm-request-actions">
                                <button
                                  className="dm-action accept"
                                  onClick={() => handleActRequest('accept', message)}
                                >
                                  Accept
                                </button>
                                <button
                                  className="dm-action reject"
                                  onClick={() => handleActRequest('reject', message)}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={directMessagesEndRef} />
                    </div>
                    <div className="dm-input">
                      {isFriendActive ? (
                        <>
                          <Form.Control
                            type="text"
                            placeholder="Write a message..."
                            value={directInput}
                            onChange={(e) => setDirectInput(e.target.value)}
                            disabled={sendingDirect}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                sendDirectMessage();
                              }
                            }}
                          />
                          <Button onClick={sendDirectMessage} disabled={!directInput.trim() || sendingDirect}>
                            {sendingDirect ? 'Sending...' : 'Send'}
                          </Button>
                        </>
                      ) : (
                        <div className="dm-request-disabled">
                          {friendName} must accept request
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
