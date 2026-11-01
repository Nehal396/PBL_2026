import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, MapPin, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, imageFor, money } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const today = new Date().toISOString().slice(0, 10);

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.max(0, Math.round((new Date(`${endDate}T00:00:00Z`) - new Date(`${startDate}T00:00:00Z`)) / 86400000));
  }, [startDate, endDate]);

  useEffect(() => {
    api(`/products/${id}`)
      .then(({ product: result }) => setProduct(result))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function book(event) {
    event.preventDefault();
    if (!user) return navigate("/login", { state: { from: `/products/${id}` } });
    if (user.role !== "customer") return setError("Sign in as a customer to request this rental.");
    setError("");
    setSubmitting(true);
    try {
      const { booking } = await api("/bookings", { method: "POST", body: JSON.stringify({ productId: id, startDate, endDate }) });
      navigate("/dashboard", { state: { confirmation: booking } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading"><span className="spinner" />Loading listing…</div>;
  if (!product) return <section className="state-card product-missing"><h1>We can’t find that listing.</h1><p>{error}</p><Link className="button button-dark" to="/browse">Back to rentals</Link></section>;

  return (
    <section className="details-page">
      <Link to="/browse" className="back-link"><ArrowLeft size={16} /> All rentals</Link>
      <div className="details-layout">
        <div className="details-main"><div className="details-photo"><img src={imageFor(product)} alt={product.title} /><span className="image-chip">{product.category}</span></div>
          <div className="details-copy"><div className="details-title"><div><span className="eyebrow">{product.condition} condition</span><h1>{product.title}</h1></div><span className="details-price">{money(product.dailyPrice)}<small> / day</small></span></div>
            <p className="details-description">{product.description}</p><div className="details-facts"><span><MapPin size={16} />{product.location || "Arrange local pickup"}</span><span><ShieldCheck size={16} />Listed by {product.owner?.name || "Rentix provider"}</span></div>
            <div className="listing-note"><span><Check size={17} /></span><div><strong>Good to know</strong><p>A provider confirms your request before the rental is final. Pickup details are arranged directly after confirmation.</p></div></div>
          </div>
        </div>
        <aside className="booking-card"><span className="eyebrow">Make it a moment</span><h2>Choose your dates</h2><p className="booking-caption">Request now, hear back from the provider.</p>
          <form onSubmit={book}><label className="form-field"><span>Pick-up date</span><span className="date-input"><CalendarDays size={16} /><input required type="date" min={today} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></span></label>
            <label className="form-field"><span>Return date <small>(exclusive)</small></span><span className="date-input"><CalendarDays size={16} /><input required type="date" min={startDate || today} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></span></label>
            {days > 0 && <div className="booking-breakdown"><div><span>{money(product.dailyPrice)} × {days} {days === 1 ? "day" : "days"}</span><span>{money(product.dailyPrice * days)}</span></div><div><span>Refundable security deposit</span><span>{money(product.securityDeposit)}</span></div><div className="booking-total"><strong>Demo total</strong><strong>{money(product.dailyPrice * days + product.securityDeposit)}</strong></div><small>No payment is collected in this demo.</small></div>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-teal button-full" disabled={submitting || !days || product.availabilityStatus !== "available"}>{submitting ? "Sending request…" : product.availabilityStatus === "available" ? "Request to rent" : "Not currently available"} <ArrowUpRight size={16} /></button>
          </form><p className="booking-small"><ShieldCheck size={14} /> Your booking stays pending until the provider confirms.</p>
        </aside>
      </div>
    </section>
  );
}
