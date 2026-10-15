import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Inbox,
  Clock,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  Search,
  Bug,
  MessageSquare,
  HelpCircle,
  MoreHorizontal,
} from 'lucide-react';
import FlyInHeading from '../components/motion/FlyInHeading';
import TicketThread from '../components/TicketThread';
import {
  adminListTickets,
  adminReplyToTicket,
  adminSetTicketStatus,
} from '../services/supportService';

const CATEGORY_META = {
  bug: { label: 'Bug', icon: Bug },
  feedback: { label: 'Feedback', icon: MessageSquare },
  question: { label: 'Question', icon: HelpCircle },
  other: { label: 'Other', icon: MoreHorizontal },
};

const dateTime = (d) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const errorText = (err, fallback) => {
  if (err.response?.status === 403) return 'Aap ke paas admin access nahi hai.';
  return err.response?.data?.message || fallback;
};

// ---------------------------------------------------------------------------
// Ek ticket: header click karne par khulta hai (message + conversation + jawab)
// ---------------------------------------------------------------------------
function AdminTicket({ ticket, onChanged }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const meta = CATEGORY_META[ticket.category] || CATEGORY_META.other;
  const CategoryIcon = meta.icon;
  const isResolved = ticket.status === 'resolved';
  const who = ticket.user;

  const run = async (action, failMsg) => {
    setBusy(true);
    setError('');
    try {
      await action();
      setText('');
      await onChanged();
    } catch (err) {
      setError(errorText(err, failMsg));
    } finally {
      setBusy(false);
    }
  };

  const sendReply = (resolve) => {
    if (!text.trim()) return;
    run(() => adminReplyToTicket(ticket._id, text.trim(), resolve), 'Jawab nahi bheja ja saka');
  };

  const toggleStatus = () =>
    run(() => adminSetTicketStatus(ticket._id, isResolved ? 'open' : 'resolved'), 'Status badal nahi saka');

  return (
    <div className={`admin-ticket ${open ? 'admin-ticket-open' : ''}`}>
      <button
        type="button"
        className="admin-ticket-head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`ticket-body-${ticket._id}`}
      >
        <div className="admin-ticket-main">
          <div className="admin-ticket-top">
            <span className="ticket-category">
              <CategoryIcon size={14} />
              {meta.label}
            </span>
            <span className={`ticket-status ${isResolved ? 'ticket-status-resolved' : 'ticket-status-open'}`}>
              {isResolved ? <CheckCircle2 size={14} /> : <Clock size={14} />}
              {isResolved ? 'Resolved' : 'Open'}
            </span>
          </div>
          <h4 className="ticket-subject">{ticket.subject}</h4>
          <small className="muted">
            {who ? `${who.name}${who.username ? ` (@${who.username})` : ''}` : 'Deleted user'} · {dateTime(ticket.updatedAt)}
            {ticket.replies?.length > 0 && ` · ${ticket.replies.length} jawab`}
          </small>
        </div>
        <ChevronDown size={18} className={`faq-chevron ${open ? 'admin-chevron-open' : ''}`} />
      </button>

      {open && (
        <div className="admin-ticket-body" id={`ticket-body-${ticket._id}`}>
          {who?.email && <p className="muted admin-ticket-email">Email: {who.email}</p>}

          <div className="ticket-reply ticket-reply-original">
            <div className="ticket-reply-meta">
              <strong>Original message</strong>
              <span className="muted">{dateTime(ticket.createdAt)}</span>
            </div>
            <p>{ticket.message}</p>
          </div>

          <TicketThread replies={ticket.replies} viewer="admin" />

          <label htmlFor={`admin-reply-${ticket._id}`} className="sr-only">Admin jawab</label>
          <textarea
            id={`admin-reply-${ticket._id}`}
            className="support-textarea admin-reply-box"
            placeholder="User ko jawab likhein..."
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
          />

          {error && <p className="error">{error}</p>}

          <div className="admin-actions">
            <button type="button" disabled={busy || !text.trim()} onClick={() => sendReply(false)}>
              Send reply
            </button>
            {!isResolved && (
              <button type="button" disabled={busy || !text.trim()} onClick={() => sendReply(true)}>
                Send &amp; resolve
              </button>
            )}
            <button type="button" className="cancel-btn" disabled={busy} onClick={toggleStatus}>
              {isResolved ? (
                <>
                  <RotateCcw size={14} /> Reopen
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Mark resolved
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function AdminSupportPage() {
  const [data, setData] = useState({ tickets: [], page: 1, pages: 1, total: 0, counts: { open: 0, resolved: 0 } });
  const [status, setStatus] = useState('open'); // '' = sab
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0); // purana (derh se aaya) response naye ko overwrite na kare

  const load = useCallback(async () => {
    const myId = ++requestId.current;
    try {
      const result = await adminListTickets({ status, category, search, page });
      if (myId !== requestId.current) return;
      setData(result);
      setError('');
    } catch (err) {
      if (myId !== requestId.current) return;
      setError(errorText(err, 'Tickets load nahi ho sake'));
    } finally {
      if (myId === requestId.current) setLoaded(true);
    }
  }, [status, category, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Filter badalne par hamesha pehle page se shuru
  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };
  const changeCategory = (value) => {
    setCategory(value);
    setPage(1);
  };
  const submitSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const { open, resolved } = data.counts;

  return (
    <div className="page-container admin-support-page">
      <div className="page-header">
        <FlyInHeading text="Support Inbox" as="h2" />
      </div>
      <p className="settings-desc">
        Users ke bheje hue tickets yahan aate hain. Ticket khol kar jawab dein; user ko notification mil jati hai.
      </p>

           <div className="stats-grid">
        {[
          ['open', open, 'Open tickets'],
          ['resolved', resolved, 'Resolved'],
          ['', open + resolved, 'Total'],
        ].map(([value, count, label]) => (
          <div
            key={label}
            className="stat-card stat-card-clickable"
            role="button"
            tabIndex={0}
            onClick={() => changeStatus(value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                changeStatus(value);
              }
            }}
          >
            <h3>{count}</h3>
            <p>{label}</p>
          </div>
        ))}
      </div>

      <div className="admin-tabs" role="group" aria-label="Status filter">
        {[
          ['open', `Open (${open})`],
          ['resolved', `Resolved (${resolved})`],
          ['', 'All'],
        ].map(([value, label]) => (
          <button
            key={label}
            type="button"
            className={`tab-btn ${status === value ? 'tab-btn-active' : ''}`}
            aria-pressed={status === value}
            onClick={() => changeStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="search-filter-bar" onSubmit={submitSearch}>
        <label htmlFor="admin-search" className="sr-only">Tickets search</label>
        <input
          id="admin-search"
          type="text"
          placeholder="Subject, message ya user (naam/email) se dhoondein..."
          value={searchInput}
          maxLength={50}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <label htmlFor="admin-category" className="sr-only">Category</label>
        <select id="admin-category" value={category} onChange={(e) => changeCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="bug">Bug</option>
          <option value="feedback">Feedback</option>
          <option value="question">Question</option>
          <option value="other">Other</option>
        </select>
        <button type="submit" className="admin-search-btn">
          <Search size={15} /> Search
        </button>
        {(search || category) && (
          <button
            type="button"
            className="clear-filter-btn"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setCategory('');
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}

      {!loaded && !error && <p className="muted">Loading...</p>}

      {loaded && !error && data.tickets.length === 0 && (
        <div className="admin-empty">
          <Inbox size={34} />
          <p>{status === 'open' && !search && !category ? 'Koi open ticket nahi — sab clear hai!' : 'Is filter mein koi ticket nahi mila.'}</p>
        </div>
      )}

      <div className="admin-ticket-list">
        {data.tickets.map((ticket) => (
          <AdminTicket key={ticket._id} ticket={ticket} onChanged={load} />
        ))}
      </div>

      {data.pages > 1 && (
        <div className="pager">
          <button type="button" className="tab-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span>
            Page {data.page} / {data.pages}
          </span>
          <button type="button" className="tab-btn" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminSupportPage;