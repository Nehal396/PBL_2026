import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { imageFor, money } from "../services/api.js";

export default function ProductCard({ product, compact = false }) {
  return (
    <article className={`product-card ${compact ? "product-card-compact" : ""}`}>
      <Link to={`/products/${product._id}`} className="product-image-wrap" aria-label={`View ${product.title}`}>
        <img src={imageFor(product)} alt={product.title} className="product-image" loading="lazy" />
        <span className="image-chip">{product.category}</span>
        <span className={`availability-dot ${product.availabilityStatus === "available" ? "" : "is-unavailable"}`} aria-label={product.availabilityStatus} />
      </Link>
      <div className="product-card-info">
        <div className="product-name-row"><div><h3><Link to={`/products/${product._id}`}>{product.title}</Link></h3><span className="product-condition">{product.condition} condition</span></div><Link to={`/products/${product._id}`} className="product-arrow" aria-label={`View ${product.title}`}><ArrowUpRight size={17} /></Link></div>
        <div className="product-card-bottom"><span className="product-location"><MapPin size={13} />{product.location || "Local pickup"}</span><span className="price">{money(product.dailyPrice)}<small> / day</small></span></div>
      </div>
    </article>
  );
}
