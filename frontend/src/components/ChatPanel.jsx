import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const normalizeIssueOptions = (issueOptions = []) => {
  const unique = [];
  const seen = new Set();

  issueOptions.forEach((item) => {
    if (!item?._id || seen.has(item._id)) return;
    seen.add(item._id);

    const locationText = item.address || item.location || "Unknown location";
    unique.push({
      _id: item._id,
      label: `${item.category || "Issue"} - ${locationText}`,
    });
  });

  return unique;
};

const normalizeWorkerOptions = (workerOptions = []) =>
  workerOptions
    .filter((item) => item?._id)
    .map((item) => ({
      _id: item._id,
      label: `${item.name || "Worker"}${item.workerId ? ` (${item.workerId})` : ""}`,
    }));

export default function ChatPanel({ token, issueOptions = [], workerOptions = [] }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [selectedIssueIdForTag, setSelectedIssueIdForTag] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [availableIssues, setAvailableIssues] = useState([]);
  const scrollRef = useRef(null);

  const currentUser = useMemo(() => getCurrentUser(), []);
  const normalizedWorkers = useMemo(() => normalizeWorkerOptions(workerOptions), [workerOptions]);
  const defaultIssueOptions = useMemo(() => normalizeIssueOptions(issueOptions), [issueOptions]);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;

    if (!normalizedWorkers.length) {
      setSelectedWorkerId("");
      return;
    }

    const stillValid = normalizedWorkers.some((item) => item._id === selectedWorkerId);
    if (!stillValid) {
      setSelectedWorkerId(normalizedWorkers[0]._id);
    }
  }, [isAdmin, normalizedWorkers, selectedWorkerId]);

  useEffect(() => {
    if (!isAdmin) {
      setAvailableIssues(defaultIssueOptions);
      return;
    }

    if (!selectedWorkerId) {
      setAvailableIssues([]);
      return;
    }

    const loadWorkerIssues = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/tasks/worker/${selectedWorkerId}/issues`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableIssues(normalizeIssueOptions(response.data || []));
      } catch {
        setAvailableIssues([]);
      }
    };

    loadWorkerIssues();
  }, [isAdmin, selectedWorkerId, token, defaultIssueOptions]);

  useEffect(() => {
    if (!availableIssues.length) {
      setSelectedIssueIdForTag("");
      return;
    }

    const exists = availableIssues.some((item) => item._id === selectedIssueIdForTag);
    if (!exists) {
      setSelectedIssueIdForTag("");
    }
  }, [availableIssues, selectedIssueIdForTag]);

  const fetchMessages = async (silent = false) => {
    if (isAdmin && !selectedWorkerId) {
      setMessages([]);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const params = {
        limit: 150,
      };

      if (isAdmin) {
        params.workerId = selectedWorkerId;
      }

      const response = await axios.get(`${API_BASE}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setMessages(response.data || []);
      setChatError("");
    } catch (err) {
      setChatError(err.response?.data?.message || "Failed to load chat messages");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedWorkerId, isAdmin]);

  useEffect(() => {
    if (isAdmin && !selectedWorkerId) return;

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedWorkerId, isAdmin]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isOwnMessage = (message) => {
    if (!currentUser) return false;

    if (currentUser.role === "admin" && message.senderRole === "admin") {
      return true;
    }

    if (currentUser.id && String(message.senderId) === String(currentUser.id)) {
      return true;
    }

    if (currentUser.email && message.senderEmail && currentUser.email === message.senderEmail) {
      return true;
    }

    return false;
  };

  const handleSend = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || sending || (isAdmin && !selectedWorkerId)) {
      return;
    }

    setSending(true);

    try {
      await axios.post(
        `${API_BASE}/api/messages`,
        {
          text: trimmed,
          issueId: selectedIssueIdForTag || null,
          receiverId: isAdmin ? selectedWorkerId : undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessageText("");
      await fetchMessages(true);
      setChatError("");
    } catch (err) {
      setChatError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const onEnterSend = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="component-section chat-panel-shell">
      <div className="chat-panel-head">
        <h3>Chat</h3>
        <div className="chat-filter-controls">
          {isAdmin && (
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="chat-issue-select"
              disabled={!normalizedWorkers.length}
            >
              {!normalizedWorkers.length && <option value="">No workers found</option>}
              {normalizedWorkers.map((worker) => (
                <option key={worker._id} value={worker._id}>
                  {worker.label}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedIssueIdForTag}
            onChange={(e) => setSelectedIssueIdForTag(e.target.value)}
            className="chat-issue-select"
            disabled={!availableIssues.length}
          >
            <option value="">Tag Issue (Optional)</option>
            {availableIssues.map((issue) => (
              <option key={issue._id} value={issue._id}>
                {issue.label}
              </option>
            ))}
          </select>
          <button type="button" className="refresh-btn" onClick={() => fetchMessages()} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {chatError && <div className="error-message">{chatError}</div>}

      <div className="chat-history" ref={scrollRef}>
        {isAdmin && !selectedWorkerId ? (
          <p className="worker-empty-text">Select a worker to start chatting.</p>
        ) : messages.length === 0 ? (
          <p className="worker-empty-text">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((message) => {
            const mine = isOwnMessage(message);
            const issueBadge = message.issueId
              ? `${message.issueId.category || "Issue"}${message.issueId.location ? ` - ${message.issueId.location}` : ""}`
              : "Issue";

            return (
              <div
                key={message._id}
                className={`chat-message-row ${mine ? "mine" : "other"}`}
              >
                <div className={`chat-message-bubble ${mine ? "mine" : "other"}`}>
                  <div className="chat-message-meta">
                    <span>{message.senderName} ({message.senderRole})</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{message.text}</p>
                  {message.issueId && <div className="chat-message-issue">Issue: {issueBadge}</div>}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="chat-compose-row">
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={onEnterSend}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          rows={3}
          className="chat-input"
        />
        <button
          type="button"
          className="submit-btn"
          onClick={handleSend}
          disabled={sending || !messageText.trim() || (isAdmin && !selectedWorkerId)}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
