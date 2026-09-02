import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import CreatePostModal from "../components/CreatePostModal";
import EditPostModal from "../components/EditPostModal";

interface Post {
  _id: string;
  title: string;
  content: string;
  authorEmail: string;
  createdAt: string;
  imageUrl?: string;
}

interface User {
  username: string;
  id?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Auth & Ownership state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Edit Modal State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Check authentication status and store user info
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, []);

  // Fetch posts
  useEffect(() => {
    fetch("http://localhost:5000/api/posts", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const postsData = Array.isArray(data)
          ? data
          : data.posts || data.data || [];
        setPosts(postsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch posts:", err);
        setError("Could not load discussions.");
        setLoading(false);
      });
  }, [refreshTrigger]);

  const handlePostCreated = () => {
    setLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOpenEditModal = (post: Post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this discussion?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete post.");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Network error occurred while attempting to delete post.");
    }
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `http://localhost:5000${cleanPath}`;
  };

  return (
    <div className="wrapper">
      <div className="container">
        <Navbar />
      </div>
      <div className="container">
        <Hero
          color="is-danger"
          title="FeverFeed"
          subtitle="Inflame your passions!"
        />
      </div>
      <div className="container section">
        <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
          <h2 className="title is-4 mb-0">Latest Discussions</h2>
          {currentUser && (
            <button
              className="button is-danger"
              onClick={() => setIsModalOpen(true)}
            >
              New Post
            </button>
          )}
        </div>

        {loading ? (
          <p>Loading posts...</p>
        ) : error ? (
          <div className="notification is-danger is-light">
            <p>{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="notification is-light has-text-centered py-6">
            <p className="title is-5">No posts found</p>
            <p className="subtitle is-6">
              Be the first to share something with the community!
            </p>
          </div>
        ) : (
          <div className="columns is-multiline">
            {posts.map((post) => {
              // Checks if currently logged-in user owns this post
              const isOwner = currentUser?.username === post.authorEmail;

              return (
                <div className="column is-12" key={post._id}>
                  <div className="card">
                    <header className="card-header is-align-items-center pr-3">
                      <p className="card-header-title">{post.title}</p>
                      
                      {/* Only render action controls if user owns the post */}
                      {isOwner && (
                        <div className="buttons are-small mb-0">
                          <button
                            className="button is-light is-info"
                            title="Edit Post"
                            onClick={() => handleOpenEditModal(post)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete ml-2"
                            aria-label="delete post"
                            title="Delete Post"
                            onClick={() => handleDeletePost(post._id)}
                          ></button>
                        </div>
                      )}
                    </header>

                    {post.imageUrl && (
                      <div className="card-image">
                        <figure className="image is-16by9">
                          <img
                            src={getImageUrl(post.imageUrl)}
                            alt={post.title}
                            style={{ objectFit: "cover" }}
                          />
                        </figure>
                      </div>
                    )}

                    <div className="card-content">
                      <p className="subtitle is-6">By {post.authorEmail}</p>
                      <div className="content">{post.content}</div>
                      <small className="has-text-grey">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <EditPostModal
        isOpen={isEditModalOpen}
        post={editingPost}
        onClose={() => setIsEditModalOpen(false)}
        onPostUpdated={handlePostUpdated}
      />

      <div className="container">
        <Footer />
      </div>
    </div>
  );
}