import { useState, useEffect } from 'react';
import { submitSupport, getMySupportTickets, replyToTicket } from '../services/supportService';
import TicketThread from '../components/TicketThread';
import { ChevronDown, Clock, CheckCircle2, Bug, MessageSquare, HelpCircle, MoreHorizontal } from 'lucide-react';

const CATEGORY_META = {
  bug: { label: 'Report a Bug', icon: Bug },
  feedback: { label: 'Feedback', icon: MessageSquare },
  question: { label: 'Question', icon: HelpCircle },
  other: { label: 'Other', icon: MoreHorizontal },
};

const FAQS = [
  {
    q: 'Meri weight/measurements kg ki jagah lbs mein kyun dikh rahi hain?',
    a: 'Settings page (sidebar mein) mein jaakar "Units of Measurement" section se kg/lbs ya cm/in badal sakte hain. Ye poori app mein turant apply ho jaata hai.',
  },
  {
    q: 'Apna data (workouts, nutrition) kaise download karun?',
    a: 'Har page (Workouts, Nutrition, Weight, Measurements, Performance) ke upar CSV aur PDF export buttons hain. Ek hi PDF mein sab kuch chahiye to "Reports" page se "Download Full Report" use karein.',
  },
  {
    q: 'Workout ya meal reminder nahi aa raha, kya karun?',
    a: 'Goals page mein jaakar reminder on hai ya nahi check karein, aur browser ne notification permission allow ki hai ya nahi. Reminder sirf tab tak kaam karta hai jab tak app ka tab khula ho.',
  },
  {
    q: 'Apna password ya username kaise badlein?',
    a: 'Profile page kholein — "Personal Information" section mein name/username/email, aur "Change Password" section mein password badal sakte hain.',
  },
  {
    q: 'Account delete karne se kya hota hai?',
    a: 'Profile page ke "Delete Account" section se account delete karne par aapka saara data — workouts, nutrition, weight, measurements, performance, sab — hamesha ke liye mit jaata hai. Ye wapis nahi ho sakta.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'faq-item-open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <ChevronDown size={18} className="faq-chevron" />
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  );
}

// Ticket ke neeche "Jawab likhein" box (user dobara likh sakta hai)
function UserReplyBox({ ticketId, onSent }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      await replyToTicket(ticketId, text.trim());
      setText('');
      onSent();
    } catch (err) {
      setError(err.response?.data?.message || 'Jawab nahi bheja ja saka, dobara koshish karein');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="ticket-reply-form" onSubmit={send}>
      <label htmlFor={`reply-${ticketId}`} className="sr-only">Apna jawab likhein</label>
      <input
        id={`reply-${ticketId}`}
        type="text"
        placeholder="Aur kuch batana hai? Yahan likhein..."
        value={text}
        maxLength={2000}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" disabled={sending || !text.trim()}>
        {sending ? 'Sending...' : 'Send'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('bug');
  const [message, setMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

   const fetchTickets = async () => {
    try {
      const data = await getMySupportTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Tickets load nahi ho sake, dobara koshish karein');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitSupport({ subject, category, message });
      setSubject('');
      setCategory('bug');
      setMessage('');
      setSuccessMsg("Your request has been submitted! We'll get back to you soon.");
      fetchTickets();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Request nahi bheji ja saki, dobara koshish karein');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="page-container support-page">
      <h2>Help & Support</h2>
      <p className="settings-desc">
        Koi sawal ho, kuch kaam na kar raha ho, ya suggestion deni ho — pehle neeche FAQs dekh lein,
        jawab na mile to form bhar kar humein bhejein.
      </p>

      {/* ---------- FAQs ---------- */}
      <div className="settings-section">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-list">
          {FAQS.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      {/* ---------- Submit a request ---------- */}
      <div className="settings-section">
        <h3>Still need help? Send us a message</h3>
        {successMsg && <p className="success-msg">{successMsg}</p>}
                {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit} className="support-form">
          <label htmlFor="sup-category">What is this about?</label>
          <select id="sup-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="bug">🐞 Report a Bug — something is broken</option>
            <option value="feedback">💬 Feedback — an idea or suggestion</option>
            <option value="question">❓ Question — I need help understanding something</option>
            <option value="other">📌 Other</option>
          </select>

          <label htmlFor="sup-subject">Subject</label>
          <input
            id="sup-subject"
            type="text"
            placeholder="Short summary, e.g. 'Weight not saving'"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <label htmlFor="sup-message">Details</label>
          <textarea
            id="sup-message"
            placeholder="Jitni detail de sakein utni acha — kya kar rahe thay, kya expect kiya, kya hua..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="support-textarea"
          />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* ---------- Ticket history ---------- */}
      <div className="settings-section">
        <h3>Your Previous Requests</h3>

        {tickets.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>
            You haven't submitted any requests yet.
          </p>
        )}

        <div className="ticket-list">
          {tickets.map((ticket) => {
            const meta = CATEGORY_META[ticket.category] || CATEGORY_META.other;
            const CategoryIcon = meta.icon;
            const isResolved = ticket.status === 'resolved';

            return (
              <div key={ticket._id} className="ticket-card">
                <div className="ticket-card-header">
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
                <p className="ticket-message">{ticket.message}</p>
                <small className="muted">{new Date(ticket.createdAt).toLocaleDateString()}</small>

                <TicketThread replies={ticket.replies} viewer="user" />
                <UserReplyBox ticketId={ticket._id} onSent={fetchTickets} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SupportPage;