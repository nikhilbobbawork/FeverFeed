import { useState, useEffect, type FormEvent } from "react";

interface Post {
  _id: string;
  title: string;
  content: string;
  authorEmail: string;
  createdAt: string;
  imageUrl?: string;
}

interface EditPostModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onPostUpdated: (updatedPost: Post) => void;
}

export default function EditPostModal({
  isOpen,
  post,
  onClose,
  onPostUpdated,
}: EditPostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when active post changes
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setFile(null);
      setError(null);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (file) {
        formData.append("image", file);
      }

      const response = await fetch(`http://localhost:5000/api/posts/${post._id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Returns updated post object from backend
        onPostUpdated(data.post || data);
        onClose();
      } else {
        setError(data.error || "Failed to update post.");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Network error occurred while updating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`modal ${isOpen ? "is-active" : ""}`}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Edit Post</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>

        <form onSubmit={handleSubmit}>
          <section className="modal-card-body">
            {error && (
              <div className="notification is-danger is-light">
                <button
                  type="button"
                  className="delete"
                  onClick={() => setError(null)}
                ></button>
                {error}
              </div>
            )}

            <div className="field">
              <label className="label">Title</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Content</label>
              <div className="control">
                <textarea
                  className="textarea"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="field">
              <label className="label">Replace Image (Optional)</label>
              <div className="file has-name is-fullwidth">
                <label className="file-label">
                  <input
                    className="file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <span className="file-cta">
                    <span className="file-label">Choose file…</span>
                  </span>
                  <span className="file-name">
                    {file ? file.name : "No new file selected"}
                  </span>
                </label>
              </div>
            </div>
          </section>

          <footer className="modal-card-foot is-justify-content-flex-end">
            <button
              type="button"
              className="button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`button is-danger ${submitting ? "is-loading" : ""}`}
            >
              Save Changes
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}