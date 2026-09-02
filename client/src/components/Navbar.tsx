import { useState, useEffect } from "react";
import SignupModal from "./SignupModal";
import LoginModal from "./LoginModal";

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isBurgerActive, setIsBurgerActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Verify authentication status on load via the HTTP-only cookie
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  const toggleLoginModal = () => setIsLoginOpen(!isLoginOpen);
  const toggleSigninModal = () => setIsSignupOpen(!isSignupOpen);
  const toggleBurger = () => setIsBurgerActive(!isBurgerActive);

  const handleLoginSuccess = () => {
    window.location.reload(); // Refreshes app to sync auth state across components
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        window.location.reload(); // Refreshes app to clear auth state
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <a className="navbar-item" href="http://localhost:5173">
            <img className="image is-3by1" src="/assets/Logo.png" alt="Logo" />
          </a>

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
            <a className="navbar-item" href="/">Home</a>
            <a className="navbar-item" href="/about">About</a>
            <a className="navbar-item" href="/contact">Contact</a>
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                {isLoggedIn ? (
                  <button className="button is-danger" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <>
                    <a className="button is-primary" onClick={toggleSigninModal}>
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