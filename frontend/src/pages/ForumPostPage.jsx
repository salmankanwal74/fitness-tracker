import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPost, addReply, deletePost, deleteReply } from '../services/forumService';

const errMsg = (err) => err.response?.data?.message || 'Something went wrong';

function ForumPostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getPost(id)
      .then((data) => !cancelled && setPost(data))
      .catch((err) => !cancelled && setError(errMsg(err)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const reload = async () => setPost(await getPost(id));

  const handleReply = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await addReply(id, reply);
      setReply('');
      await reload();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Ye post delete karein?')) return;
    try {
      await deletePost(id);
      navigate('/forum');
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await deleteReply(id, replyId);
      await reload();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!post) {
    return (
      <div className="page-container">
        {error ? <p className="error">{error}</p> : <p>Loading...</p>}
        <Link to="/forum">← Forum</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <p><Link to="/forum">← Forum</Link></p>

      <div className="chart-container">
        <h2>{post.title}</h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{post.body}</p>
        <small>
          {post.author?.name || 'Deleted user'} · {new Date(post.createdAt).toLocaleString()}
        </small>
        {post.author?._id === user._id && (
          <p><button onClick={handleDeletePost}>Delete post</button></p>
        )}
      </div>

      <h3>{post.replies.length} Replies</h3>
      <div className="workout-list">
        {post.replies.map((r) => (
          <div key={r._id} className="workout-card">
            <div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{r.body}</p>
              <small>
                {r.author?.name || 'Deleted user'} · {new Date(r.createdAt).toLocaleString()}
              </small>
            </div>
            {r.author?._id === user._id && (
              <button onClick={() => handleDeleteReply(r._id)} aria-label="Delete reply">Delete</button>
            )}
          </div>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleReply} className="forum-form">
        <textarea
          placeholder="Apna reply likhein"
          aria-label="Reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          maxLength={1000}
          rows={3}
          required
        />
        <button type="submit">Reply</button>
      </form>
    </div>
  );
}

export default ForumPostPage;