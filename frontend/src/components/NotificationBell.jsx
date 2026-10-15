import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
} from '../services/notificationService';

const POLL_MS = 60 * 1000; // har 1 minute baad naye notifications check

const ICONS = {
  workout_completed: '💪',
  workout_milestone: '🏆',
  streak: '🔥',
  goal_workouts: '🎯',
  goal_weight: '🎯',
  goal_calories: '⚠️',
  weight_progress: '📉',
  follower: '👤',
  forum_reply: '💬',
  support_ticket: '📩',
  support_reply: '🎧',
  system: '🔔',
};
// Agar notification mein link save nahi hai (purani notifications), to type se page chuno
const FALLBACK_LINK = {
  forum_reply: '/forum',
  support_ticket: '/admin/support',
  support_reply: '/support',
  follower: '/community',
  goal_workouts: '/goals',
  goal_weight: '/goals',
  goal_calories: '/goals',
  workout_completed: '/workouts',
  workout_milestone: '/workouts',
  streak: '/workouts',
  weight_progress: '/weight',
};

const timeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'abhi';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min pehle`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ghante pehle`;
  const days = Math.floor(hours / 24);
  return `${days} din pehle`;
};

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications();
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      // network error par chup raho, agli poll par dobara try hoga
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    // Workout/weight/nutrition add hone ke baad api.js ye event bhejta hai
    const onRefresh = () => load();
    window.addEventListener('notifications:refresh', onRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:refresh', onRefresh);
    };
  }, [load]);

  // Bahar click karne ya Escape dabane par band
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) load();
  };

  const handleRead = async (n) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(n._id);
    } catch {
      load();
    }
  };

  // Notification par click: read mark karo aur wahan le jao
  const handleClick = (n) => {
    handleRead(n);
    const target = n.link || FALLBACK_LINK[n.type];
    if (target) {
      setOpen(false);
      navigate(target);
    }
  };

  const handleReadAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  };

  const handleDelete = async (e, n) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((x) => x._id !== n._id));
    if (!n.read) setUnread((c) => Math.max(0, c - 1));
    try {
      await deleteNotification(n._id);
    } catch {
      load();
    }
  };

  const handleClear = async () => {
    setItems([]);
    setUnread(0);
    try {
      await clearNotifications();
    } catch {
      load();
    }
  };

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        className="notif-bell"
        onClick={handleOpen}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell size={20} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-header">
            <strong>Notifications</strong>
            <div className="notif-actions">
              <button onClick={handleReadAll} disabled={unread === 0} title="Sab read karein">
                <CheckCheck size={16} />
              </button>
              <button onClick={handleClear} disabled={items.length === 0} title="Sab delete karein">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setOpen(false)} title="Band karein">
                <X size={16} />
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="notif-empty">Abhi koi notification nahi hai</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li
                  key={n._id}
                  className={`notif-item ${n.read ? '' : 'notif-unread'}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="notif-icon">{ICONS[n.type] || '🔔'}</span>
                  <div className="notif-body">
                    <p>{n.message}</p>
                    <small>{timeAgo(n.createdAt)}</small>
                  </div>
                  <button
                    className="notif-delete"
                    onClick={(e) => handleDelete(e, n)}
                    aria-label="Delete notification"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;