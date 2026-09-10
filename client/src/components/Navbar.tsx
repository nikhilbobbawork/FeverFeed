import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SignupModal from "./SignupModal";
import LoginModal from "./LoginModal";

interface User {
  username: string;
  email?: string;
}

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isBurgerActive, setIsBurgerActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Verify authentication status and load user details via the HTTP-only cookie
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then((data) => {
        // /api/auth/me returns { user: { id, email } }
        const userObj = data.user || data;
        const userIdentifier = userObj.username || userObj.email;

        if (userIdentifier) {
          setIsLoggedIn(true);
          setCurrentUser({ username: userIdentifier });
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        setCurrentUser(null);
      });
  }, []);

  const toggleLoginModal = () => setIsLoginOpen(!isLoginOpen);
  const toggleSigninModal = () => setIsSignupOpen(!isSignupOpen);
  const toggleBurger = () => setIsBurgerActive(!isBurgerActive);

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className="navbar-item" to="/">
            <img className="image is-3by1" src="/assets/Logo.png" alt="Logo" />
          </Link>

          <a
            role="button"
            className={`navbar-burger ${isBurgerActive ? "is-active" : ""}`}
            aria-label="menu"
            aria-expanded={isBurgerActive}
            onClick={toggleBurger}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div className={`navbar-menu ${isBurgerActive ? "is-active" : ""}`}>
          <div className="navbar-start">
            <Link className="navbar-item" to="/">
              Home
            </Link>
            <Link className="navbar-item" to="/about">
              About
            </Link>
            <Link className="navbar-item" to="/contact">
              Contact
            </Link>
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                {isLoggedIn && currentUser ? (
                  <>
                    <Link
                      to={`/profile/${encodeURIComponent(currentUser.username)}`}
                      className="button is-info is-light"
                    >
                      <strong>Profile ({currentUser.username})</strong>
                    </Link>

                    <button className="button is-danger" onClick={handleLogout}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      className="button is-primary"
                      onClick={toggleSigninModal}
                    >
                      <strong>Sign up</strong>
                    </a>
                    <a className="button is-light" onClick={toggleLoginModal}>
                      Log in
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSignupSuccess={() => window.location.reload()}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
