import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Section from "../components/Section";
import Footer from "../components/Footer";

export default function About() {
  return (
    <>
      <div className="wrapper">
        <div className="container">
          <Navbar />
        </div>
        <div className="container">
          <Hero
            color="is-danger"
            title="About Us"
            subtitle="Learn how it all began"
          />
        </div>
        <div className="container">
          <Section />
        </div>
        <div className="container">
          <Footer />
        </div>
      </div>
    </>
  );
}