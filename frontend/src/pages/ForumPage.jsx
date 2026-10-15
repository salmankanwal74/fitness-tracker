import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, createPost } from '../services/forumService';

const errMsg = (err) => err.response?.data?.message || 'Something went wrong';

function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState(''); // jo search lagayi ja chuki hai
  const [refresh, setRefresh] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPosts({ page, search: query })
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts);
        setPages(data.pages);
      })
      .catch((err) => !cancelled && setError(errMsg(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, query, refresh]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createPost({ title, body });
      setTitle('');
      setBody('');
      setSearch('');
      setQuery('');
      setPage(1);
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Forum</h2>
      </div>

      <form onSubmit={handleCreate} className="chart-container forum-form">
        <h3>Nayi post likhein</h3>
        <input
          type="text"
          placeholder="Title"
          aria-label="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
        />
        <textarea
          placeholder="Aap kya poochna ya share karna chahte hain?"
          aria-label="Post body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={4}
          required
        />
        <button type="submit">Post</button>
      </form>

      <form className="search-filter-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Posts mein search karein"
          aria-label="Search posts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && posts.length === 0 && <p>Abhi koi post nahi hai.</p>}

      <div className="workout-list">
        {posts.map((p) => (
          <Link key={p._id} to={`/forum/${p._id}`} className="forum-link">
            <div className="workout-card">
              <div>
                <p><strong>{p.title}</strong></p>
                <p>{p.body}</p>
                <small>
                  {p.author?.name || 'Deleted user'}
                  {p.author?.username ? ` (@${p.author.username})` : ''} ·{' '}
                  {new Date(p.createdAt).toLocaleString()} · {p.repliesCount} replies
                </small>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {pages > 1 && (
        <div className="pager">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

export default ForumPage;