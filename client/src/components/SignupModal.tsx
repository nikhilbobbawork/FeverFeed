import React, { useState } from "react";
//import "./SignupModal.css";

// 1. Define an interface for what your backend returns on success
interface SignupResponse {
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
  };
}

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess?: (data: SignupResponse) => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // 2. Type-cast the parsed JSON response using our interface
      const data: SignupResponse = await response.json();

      if (!response.ok) {
        // Handle potential error messages safely
        const errorData = data as { message?: string };
        throw new Error(errorData.message || "Something went wrong during signup.");
      }

      console.log("Signup successful:", data);
      if (onSignupSuccess) onSignupSuccess(data);

      onClose();
      setFormData({ email: "", password: "", confirmPassword: "" });
    } catch (error: unknown) {
      // 3. Narrow down the unknown error type safely without using 'any'
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`modal ${isOpen ? "is-active" : ""}`}>
      <div className="modal-background" onClick={onClose}></div>

      <div className="modal-content">
        <div className="box">
          <h2>Create an Account</h2>
          {errorMessage && <div className="error-alert notification is-danger is-light">{errorMessage}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="email">Email:</label>
              <div className="control has-icons-left has-icons-right">
                <input
                  className="input"
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-envelope"></i>
                </span>
                <span className="icon is-small is-right">
                  <i className="fas fa-check"></i>
                </span>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="password">Password:</label>
              <div className="control has-icons-left">
                <input
                  className="input"
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-lock"></i>
                </span>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="confirmPassword">Confirm Password:</label>
              <div className="control has-icons-left">
                <input
                  className="input"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-lock"></i>
                </span>
              </div>
            </div>

            <div className="field is-grouped is-grouped-centered">
              <div className="control">
                <button
                  className="button is-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing up..." : "Sign Up"}
                </button>
              </div>
              <div className="control">
                <button
                  type="button"
                  className="button is-light"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <button
        className="modal-close is-large"
        aria-label="close"
        onClick={onClose}
      ></button>
    </div>
  );
};

export default SignupModal;