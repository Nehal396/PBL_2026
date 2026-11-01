import { Link } from "react-router-dom";

export default function NotFound() {
  return <section className="state-card not-found"><span className="eyebrow">404 · off the map</span><h1>This page took<br />the scenic route.</h1><p>We couldn’t find the page you were looking for.</p><Link className="button button-dark" to="/">Back to the good stuff</Link></section>;
}
