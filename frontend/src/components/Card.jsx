import "./Card.css";

export default function Card({ title, value, variant = "default" }) {
  return (
    <div className={`card card--${variant}`}>
      <div className="card__title">{title}</div>
      <div className="card__value">{value}</div>
    </div>
  );
}