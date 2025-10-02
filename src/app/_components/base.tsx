"use client";

interface BaseProps {
  name: string;
  description: string;
}

export default function Base({ name, description }: BaseProps) {
  return (
    <div className="base-card">
      <div className="base-icon">
        {name ? name.slice(0, 2).toUpperCase() : "??"}
      </div>
      <div className="base-info">
        <h4>{name}</h4>
        <span>{description}</span>
      </div>
    </div>
  );
}
