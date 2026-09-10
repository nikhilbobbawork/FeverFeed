import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface UserProfile {
  _id?: string;
  username: string;
  createdAt?: string;
}

interface UserPost {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  upvoteCount?: number;
}

interface UserComment {
  _id: string;
  content: string;
  createdAt: string;
  post?: {
    _id: string;
    title: string;
  };
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [stats, setStats] = useState({ totalPosts: 0, totalComments: 0 });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");

  useEffect(() => {
    let isMounted = true;

    if (!username) {
      setError("No username specified.");
      setLoading(false);
      return;
    }

    const safeUsername = encodeURIComponent(username);

    fetch(`http://localhost:5000/api/users/${safeUsername}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("User not found or network error");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setProfile(data.user);
        setPosts(data.posts || []);
        setComments(data.comments || []);
        setStats(data.stats || { totalPosts: 0, totalComments: 0 });
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error loading profile:", err);
        setError("Could not load user profile.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleTabChange = (newTab: "posts" | "comments") => {
    setActiveTab(newTab);
  };

  return (
    <div className="wrapper">
      <div className="container">
        <Navbar />
      </div>

      <div className="container section">
        {loading ? (
          <p>Loading user profile...</p>
        ) : error ? (
          <div className="notification is-danger is-light">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* User Details Header */}
            <div className="box mb-5">
              <div className="media">
                <div className="media-content">
                  <p className="title is-3">{profile?.username}</p>
                  <p className="subtitle is-6 has-text-grey">
                    Member since:{" "}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <div className="tags">
                    <span className="tag is-danger is-light">
                      {stats.totalPosts} Posts
                    </span>
                    <span className="tag is-info is-light">
                      {stats.totalComments} Comments
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs is-boxed mb-4">
              <ul>
                <li className={activeTab === "posts" ? "is-active" : ""}>
                  <button
                    className="button is-ghost py-0 px-3 custom-tab-btn"
                    onClick={() => handleTabChange("posts")}
                  >
                    <span>Posts ({stats.totalPosts})</span>
                  </button>
                </li>
                <li className={activeTab === "comments" ? "is-active" : ""}>
                  <button
                    className="button is-ghost py-0 px-3 custom-tab-btn"
                    onClick={() => handleTabChange("comments")}
                  >
                    <span>Comments ({stats.totalComments})</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Tab Contents */}
            {activeTab === "posts" ? (
              posts.length === 0 ? (
                <div className="notification is-light has-text-centered py-5">
                  <p className="subtitle is-6">No discussions posted yet.</p>
                </div>
              ) : (
                <div className="columns is-multiline">
                  {posts.map((post) => (
                    <div className="column is-12" key={post._id}>
                      <div className="card">
                        <header className="card-header">
                          <p className="card-header-title">{post.title}</p>
                        </header>
                        <div className="card-content">
                          <div className="content">{post.content}</div>
                          <small className="has-text-grey">
                            Posted on{" "}
                            {new Date(post.createdAt).toLocaleDateString()} ·{" "}
                            {post.upvoteCount || 0} Upvotes
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : comments.length === 0 ? (
              <div className="notification is-light has-text-centered py-5">
                <p className="subtitle is-6">No comments written yet.</p>
              </div>
            ) : (
              <div className="columns is-multiline">
                {comments.map((comment) => (
                  <div className="column is-12" key={comment._id}>
                    <div className="box">
                      <p className="subtitle is-6 mb-2">
                        Commented on:{" "}
                        {comment.post ? (
                          <Link to={`/posts/${comment.post._id}`}>
                            <strong>{comment.post.title}</strong>
                          </Link>
                        ) : (
                          <strong>Discussion Post</strong>
                        )}
                      </p>
                      <div className="content">{comment.content}</div>
                      <small className="has-text-grey">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="container">
        <Footer />
      </div>
    </div>
  );
}