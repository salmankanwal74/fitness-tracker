import { useState, useEffect, useRef } from 'react';
import {
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSuggestions,
} from '../services/socialService';

const errMsg = (err) => err.response?.data?.message || 'Something went wrong';

const TABS = [
  { id: 'suggested', label: 'Suggested' },
  { id: 'search', label: 'Find Users' },
  { id: 'followers', label: 'My Followers' },
  { id: 'following', label: 'Following' },
];

function UserRow({ u, onToggle, busy }) {
  return (
    <div className="workout-card">
      <div>
        <p>
          <strong>{u.name}</strong> {u.username && <span>@{u.username}</span>}
        </p>
        <small>{u.followersCount} followers</small>
      </div>
      <button
        onClick={() => onToggle(u)}
        disabled={busy}
        aria-pressed={!!u.isFollowing}
        aria-label={`${u.isFollowing ? 'Unfollow' : 'Follow'} ${u.name}`}
      >
        {u.isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    </div>
  );
}

function CommunityPage() {
  const [tab, setTab] = useState('suggested');
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [busyIds, setBusyIds] = useState([]);
  const reqId = useRef(0); // purani responses ignore karne ke liye

  const switchTab = (t) => {
    reqId.current += 1; // in-flight request cancel
    setTab(t);
    setUsers([]);
    setPage(1);
    setPages(1);
    setError('');
    setSearched(false);
  };

  const runSearch = async (p = 1) => {
    if (q.trim().length < 2) {
      setError('Kam az kam 2 characters likhein');
      return;
    }
    const id = ++reqId.current;
    setError('');
    setLoading(true);
    try {
      const data = await searchUsers(q.trim(), p);
      if (id !== reqId.current) return;
      setUsers(data.users);
      setPage(data.page);
      setPages(data.pages);
      setSearched(true);
    } catch (err) {
      if (id === reqId.current) setError(errMsg(err));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'search') {
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const load =
      tab === 'suggested' ? getSuggestions : tab === 'followers' ? getFollowers : getFollowing;
    load()
      .then((data) => id === reqId.current && setUsers(data))
      .catch((err) => id === reqId.current && setError(errMsg(err)))
      .finally(() => id === reqId.current && setLoading(false));
  }, [tab]);

  const toggle = async (u) => {
    if (busyIds.includes(u._id)) return;
    setBusyIds((ids) => [...ids, u._id]);
    setError('');
    try {
      if (u.isFollowing) await unfollowUser(u._id);
      else await followUser(u._id);
      setUsers((list) =>
        list.map((x) =>
          x._id === u._id
            ? {
                ...x,
                isFollowing: !u.isFollowing,
                followersCount: Math.max(0, x.followersCount + (u.isFollowing ? -1 : 1)),
              }
            : x
        )
      );
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusyIds((ids) => ids.filter((i) => i !== u._id));
    }
  };

  const emptyText =
    tab === 'search'
      ? searched
        ? 'Koi user nahi mila.'
        : 'Kisi user ko dhoondhne ke liye search karein.'
      : 'Abhi koi nahi hai.';

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Community</h2>
      </div>

      <div className="tab-row" role="tablist" aria-label="Community sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab-btn ${tab === t.id ? 'tab-btn-active' : ''}`}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <form
          className="search-filter-bar"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(1);
          }}
        >
          <input
            type="text"
            placeholder="Name ya username likhein"
            aria-label="Search users"
            maxLength={50}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p role="status" aria-live="polite">
          Loading...
        </p>
      )}

      <div className="workout-list">
        {!loading && users.length === 0 && <p>{emptyText}</p>}
        {users.map((u) => (
          <UserRow key={u._id} u={u} onToggle={toggle} busy={busyIds.includes(u._id)} />
        ))}
      </div>

      {tab === 'search' && pages > 1 && (
        <div className="pager">
          <button disabled={page <= 1 || loading} onClick={() => runSearch(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button disabled={page >= pages || loading} onClick={() => runSearch(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default CommunityPage;