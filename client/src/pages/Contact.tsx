import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

export default function Contact() {
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, question }),
      });

      if (response.ok) {
        setStatus("Message sent successfully!");
        setSubject("");
        setQuestion("");
      } else {
        setStatus("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setStatus("An error occurred. Check your connection.");
    }
  };

  return (
    <>
      <div className="wrapper">
        <div className="container">
          <Navbar />
        </div>
        <div className="container">
          <Hero
            color="is-danger"
            title="Contact Page"
            subtitle="Contact Us Below!"
          />
        </div>
        <div className="container">
          <div className="section">
            <div className="form">
              <form onSubmit={handleSubmit}>
                <div className="field is-horizontal">
                  <div className="field-label is-normal">
                    <label className="label">Subject</label>
                  </div>
                  <div className="field-body">
                    <div className="field">
                      <div className="control">
                        <input
                          className="input"
                          type="text"
                          name="subject"
                          value={subject}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                          placeholder="e.g. Partnership opportunity"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="field is-horizontal">
                  <div className="field-label is-normal">
                    <label className="label">Question</label>
                  </div>
                  <div className="field-body">
                    <div className="field">
                      <div className="control">
                        <textarea
                          className="textarea"
                          name="question"
                          value={question}
                          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                          placeholder="Explain how we can help you"
                          required
                        ></textarea>
                      </div>
                    </div>
                    <br />
                    <div className="field">
                      <div className="buttons">
                        <button className="button is-inverted is-rounded is-success" type="submit">
                          Submit
                        </button>
                        <button 
                          className="button is-inverted is-rounded is-white" 
                          type="reset"
                          onClick={() => { setSubject(""); setQuestion(""); setStatus(""); }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              {status && <p className="help is-info mt-3">{status}</p>}
            </div>
          </div>
        </div>
        <div className="container">
          <Footer />
        </div>
      </div>
    </>
  );
}