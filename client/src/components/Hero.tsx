interface HeroProps {
  title?: string;
  subtitle?: string;
  color?: "is-danger" | "is-primary" | "is-dark" | "is-info" | "is-success" | "is-warning";
  size?: "is-small" | "is-medium" | "is-large" | "is-halfheight" | "is-fullheight";
}

export default function Hero({ title, subtitle, color = "is-danger", size = "is-medium" }: HeroProps) {
  return (
    <section className={`hero ${size} ${color}`}>
      <div className="hero-body">
        <p className="title">{title || "FeverFeed"}</p>
        <p className="subtitle">{subtitle || "Inflame your passions!"}</p>
      </div>
    </section>
  );
}