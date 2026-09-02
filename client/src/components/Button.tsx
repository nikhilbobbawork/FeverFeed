interface ButtonProps {
  title?: string;
  color?: "is-white" | "is-light" | "is-dark" | "is-black" | "is-text" | "is-ghost" | "is-primary" | "is-link" | "is-info" | "is-success" | "is-warning" | "is-danger";
  size?: "is-small" | "is-medium" | "is-large" | "is-normal";
}

export default function Button({ title, color = "is-primary", size = "is-medium" }: ButtonProps) {
  return (
    <button className={`button ${size} ${color}`}>{title}</button>
  );
}
