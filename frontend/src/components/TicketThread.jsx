import { ShieldCheck, User } from 'lucide-react';

const formatTime = (d) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Ticket ke jawab (admin aur user dono) ek conversation ki tarah dikhata hai.
// "viewer" = 'user' ya 'admin' — apne messages right par, doosre ke left par.
function TicketThread({ replies = [], viewer = 'user' }) {
  if (!replies.length) return null;

  return (
    <div className="ticket-thread" aria-label="Ticket conversation">
      {replies.map((r) => {
        const mine = r.from === viewer;
        const isAdmin = r.from === 'admin';
        return (
          <div key={r._id} className={`ticket-reply ${mine ? 'ticket-reply-mine' : ''} ${isAdmin ? 'ticket-reply-admin' : ''}`}>
            <div className="ticket-reply-meta">
              {isAdmin ? <ShieldCheck size={13} /> : <User size={13} />}
              <strong>{isAdmin ? 'Support team' : 'User'}</strong>
              <span className="muted">{formatTime(r.createdAt)}</span>
            </div>
            <p>{r.message}</p>
          </div>
        );
      })}
    </div>
  );
}

export default TicketThread;