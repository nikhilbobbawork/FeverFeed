import { useState } from "react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImageFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleClearForm = () => {
    setTitle("");
    setContent("");
    setImageFile(null);
    setPreviewUrl(null);
    setStatus("");
  };

  const handleCloseModal = () => {
    handleClearForm();
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setStatus("Publishing...");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      
      // Field name matches Multer's upload.single("image") middleware
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        credentials: "include", // Sends JWT auth cookie
        body: formData, // Do NOT add 'Content-Type' header here
      });

      const data = await response.json();

      if (response.ok) {
        handleClearForm();
        onPostCreated();
        onClose();
      } else {
        setStatus(data.error || "Failed to create post. Are you logged in?");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setStatus("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={handleCloseModal}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Create a New Discussion</p>
          <button
            className="delete"
            aria-label="close"
            onClick={handleCloseModal}
          ></button>
        </header>

        <section className="modal-card-body">
          <form onSubmit={handleSubmit} id="post-form">
            <div className="field">
              <label className="label">Title</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Content</label>
              <div className="control">
                <textarea
                  className="textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={loading}
                  required
                ></textarea>
              </div>
            </div>

            {/* Bulma File Upload Field */}
            <div className="field">
              <label className="label">Cover Image (Optional)</label>
              <div className="file has-name is-fullwidth">
                <label className="file-label">
                  <input
                    className="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  <span className="file-cta">
                    <span className="file-label">Choose a file…</span>
                  </span>
                  <span className="file-name">
                    {imageFile ? imageFile.name : "No file selected"}
                  </span>
                </label>
              </div>
            </div>

            {/* Image Preview */}
            {previewUrl && (
              <div className="field mt-3">
                <figure className="image is-4by3" style={{ overflow: "hidden" }}>
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    style={{ objectFit: "cover", borderRadius: "6px" }}
                  />
                </figure>
              </div>
            )}
          </form>

          {status && <p className="help is-info mt-3">{status}</p>}
        </section>

        <footer className="modal-card-foot">
          <button
            className={`button is-danger ${loading ? "is-loading" : ""}`}
            type="submit"
            form="post-form"
            disabled={loading}
          >
            Publish
          </button>
          <button
            className="button"
            onClick={handleCloseModal}
            disabled={loading}
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}