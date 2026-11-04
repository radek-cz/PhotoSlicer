import type { PropsWithChildren } from "react";
import "./Card.css";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export const Card = ({ children, className }: CardProps) => (
  <article className={className ? `ui-card ${className}` : "ui-card"}>
    {children}
  </article>
);
