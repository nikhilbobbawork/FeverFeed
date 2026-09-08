// components/CommentSection.tsx
import { useState, useEffect } from "react";

interface Comment {
  _id: string;
  postId: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
  currentUser: { id?: string; email?: string } | null;
}

export default function CommentSection({ postId, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setComments(data.comments);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load comments:", err);
        setLoading(false);
      });
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newComment }),
      });

      const data = await response.json();
      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
      } else {
        alert(data.error || "Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid #f0f0f0" }}>
      <h3 className="subtitle is-6 mb-3">Comments ({comments.length})</h3>

      {/* New Comment Input */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="field">
            <div className="control">
              <textarea
                className="textarea is-small"
                placeholder="Write a response..."
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
            </div>
          </div>
          <button
            type="submit"
            className={`button is-danger is-small ${submitting ? "is-loading" : ""}`}
            disabled={!newComment.trim()}
          >
            Post Comment
          </button>
        </form>
      ) : (
        <p className="has-text-grey is-size-7 mb-3">Log in to leave a comment.</p>
      )}

      {/* Comment Feed */}
      {loading ? (
        <p className="is-size-7">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="has-text-grey-light is-size-7">No comments yet.</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <article className="media py-2" key={comment._id}>
              <div className="media-content">
                <div className="content">
                  <p className="is-size-7 mb-1">
                    <strong>{comment.authorEmail}</strong>{" "}
                    <small className="has-text-grey ml-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </small>
                  </p>
                  <p className="is-size-6">{comment.content}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}