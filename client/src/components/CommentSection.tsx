// components/CommentSection.tsx
import { useState, useEffect } from "react";

interface Comment {
  _id: string;
  postId: string;
  authorEmail: string;
  authorId?: string;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
  currentUser: { id?: string; _id?: string; username?: string; email?: string } | null;
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

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      } else {
        alert(data.error || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid #f0f0f0" }}>
      <h3 className="subtitle is-6 mb-3">Comments ({comments.length})</h3>

      {/* New Comment Form */}
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
          {comments.map((comment) => {
            const isOwner =
              currentUser?.email === comment.authorEmail ||
              currentUser?.username === comment.authorEmail;

            return (
              <article className="media py-2" key={comment._id}>
                <div className="media-content">
                  <div className="content">
                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                      <p className="is-size-7 mb-1">
                        <strong>{comment.authorEmail}</strong>{" "}
                        <small className="has-text-grey ml-2">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </small>
                      </p>

                      {/* Trash Icon Delete Button */}
                      {isOwner && (
                        <button
                          className="button is-ghost is-small p-1 ml-2"
                          title="Delete Comment"
                          onClick={() => handleDelete(comment._id)}
                          style={{ height: "auto", border: "none" }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#f14668"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="is-size-6 mb-0">{comment.content}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}