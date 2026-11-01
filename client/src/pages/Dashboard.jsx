import { useEffect, useState } from "react";
import { ArrowUpRight, BadgeCheck, CalendarDays, Check, CircleDollarSign, ClipboardList, Package, Plus, Shield, Trash2, Users, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api, imageFor, money } from "../services/api.js";

const categories = ["Cameras", "Gaming consoles", "Projectors", "Bikes and scooters", "Electronics", "Other consumer goods"];
const initialProduct = { title: "", description: "", category: "Cameras", dailyPrice: "", securityDeposit: "0", condition: "Good", location: "", image: "", availabilityStatus: "available" };

function dateLabel(date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}

function Status({ status }) {
  return <span className={`status-pill status-${status}`}>{status?.replace("_", " ")}</span>;
}

function BookingRow({ booking, canManage, canCancel, onStatus, onCancel }) {
  return <article className="dashboard-booking">
    <div className="booking-product-thumb"><img src={imageFor(booking.product)} alt="" /></div>
    <div className="booking-product-info"><strong>{booking.product?.title || "Listing unavailable"}</strong><span>{dateLabel(booking.startDate)} – {dateLabel(booking.endDate)} · {booking.rentalDays} days</span><small>{canManage ? `Requested by ${booking.customer?.name || "customer"}` : "Rental request"}</small></div>
    <div className="booking-row-end"><strong>{money(booking.totalAmount)}</strong><Status status={booking.status} />{canManage && booking.status === "pending" && <div className="booking-actions"><button title="Approve request" onClick={() => onStatus(booking._id, "confirmed")}><Check size={15} /></button><button title="Reject request" onClick={() => onStatus(booking._id, "rejected")}><X size={15} /></button></div>}{canCancel && ["pending", "confirmed"].includes(booking.status) && <button className="cancel-booking" onClick={() => onCancel(booking._id)}>Cancel</button>}</div>
  </article>;
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.confirmation ? "Your demo booking request has been sent. No payment was collected." : "");
  const [editing, setEditing] = useState("");
  const [form, setForm] = useState(initialProduct);
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || "" });
  const [bookingFilter, setBookingFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      if (user.role === "provider") {
        const [productData, bookingData] = await Promise.all([api("/provider/products"), api("/provider/bookings")]);
        setProducts(productData.products);
        setBookings(bookingData.bookings);
      } else if (user.role === "admin") {
        const [statsData, userData, productData, bookingData] = await Promise.all([
          api("/admin/stats"), api("/admin/users?limit=50"), api("/admin/products?limit=50"), api("/provider/bookings?limit=50")
        ]);
        setStats(statsData.stats);
        setUsers(userData.users);
        setAdminProducts(productData.products);
        setBookings(bookingData.bookings);
      } else {
        const result = await api("/bookings/my?limit=50");
        setBookings(result.bookings);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user.role]);

  async function changeBooking(id, status) {
    setError("");
    try {
      await api(`/provider/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice(status === "confirmed" ? "Rental request confirmed." : "Rental request declined.");
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function cancelBooking(id) {
    setError("");
    try {
      await api(`/bookings/${id}/cancel`, { method: "PATCH" });
      setNotice("Booking cancelled.");
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  function beginEdit(product) {
    setEditing(product._id);
    setForm({ title: product.title, description: product.description, category: product.category, dailyPrice: String(product.dailyPrice), securityDeposit: String(product.securityDeposit), condition: product.condition, location: product.location || "", image: product.images?.[0] || "", availabilityStatus: product.availabilityStatus });
    document.getElementById("listing-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const body = { ...form, dailyPrice: Number(form.dailyPrice), securityDeposit: Number(form.securityDeposit), images: form.image.trim() ? [form.image.trim()] : [] };
    delete body.image;
    try {
      await api(editing ? `/products/${editing}` : "/products", { method: editing ? "PATCH" : "POST", body: JSON.stringify(body) });
      setNotice(editing ? "Listing updated." : "Your new listing is live.");
      setForm(initialProduct);
      setEditing("");
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function removeProduct(id) {
    if (!window.confirm("Remove this listing? Pending or confirmed rentals must be resolved first.")) return;
    try {
      await api(`/products/${id}`, { method: "DELETE" });
      setNotice("Listing removed.");
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    try {
      const { user: updated } = await api("/auth/me", { method: "PATCH", body: JSON.stringify(profile) });
      updateUser(updated);
      setNotice("Profile saved.");
    } catch (requestError) { setError(requestError.message); }
  }

  async function toggleUser(target) {
    try {
      await api(`/admin/users/${target._id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !target.isActive }) });
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function toggleProduct(target) {
    try {
      await api(`/admin/products/${target._id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !target.isActive }) });
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  if (loading) return <div className="page-loading"><span className="spinner" />Gathering your Rentix…</div>;

  const filteredBookings = user.role !== "customer" || bookingFilter === "all" ? bookings : bookings.filter((booking) => {
    const todayDate = new Date().toISOString().slice(0, 10);
    if (bookingFilter === "current") return booking.status === "confirmed" && booking.startDate.slice(0, 10) <= todayDate && booking.endDate.slice(0, 10) > todayDate;
    if (bookingFilter === "upcoming") return ["pending", "confirmed"].includes(booking.status) && booking.startDate.slice(0, 10) >= todayDate;
    return ["completed", "rejected", "cancelled"].includes(booking.status) || booking.endDate.slice(0, 10) <= todayDate;
  });

  return <section className="dashboard-page">
    <div className="dashboard-heading"><div><span className="eyebrow">{user.role === "admin" ? "The whole neighbourhood" : user.role === "provider" ? "Your sharing shelf" : "Your little corner"}</span><h1>{user.role === "admin" ? "Admin overview." : <>Good to see you, <em>{user.name.split(" ")[0]}.</em></>}</h1><p>{user.role === "admin" ? "A clear view of the Rentix community." : user.role === "provider" ? "Manage the things you share and the requests they bring." : "Your plans, rentals and profile all in one place."}</p></div><div className="dashboard-heading-actions">{user.role === "provider" && <a className="button button-dark" href="#listing-form"><Plus size={16} /> Add a listing</a>}{user.role === "customer" && <Link className="button button-dark" to="/browse">Find a rental <ArrowUpRight size={16} /></Link>}</div></div>
    {notice && <div className="notice-banner"><BadgeCheck size={17} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}
    {error && <div className="dashboard-error" role="alert">{error}</div>}

    {user.role === "customer" && <div className="dashboard-columns"><div className="dashboard-primary"><section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">The important dates</span><h2>Your rentals</h2></div><span className="panel-count">{bookings.length} total</span></div><div className="booking-filter-tabs" role="group" aria-label="Filter rentals">{[["all", "All"], ["upcoming", "Upcoming"], ["current", "Current"], ["history", "Past & history"]].map(([value, label]) => <button key={value} className={bookingFilter === value ? "is-selected" : ""} onClick={() => setBookingFilter(value)}>{label}</button>)}</div>{bookings.length ? filteredBookings.length ? <div className="dashboard-booking-list">{filteredBookings.map((booking) => <BookingRow key={booking._id} booking={booking} canCancel onCancel={cancelBooking} />)}</div> : <div className="empty-dashboard"><CalendarDays /><h3>Nothing in this view yet.</h3><p>Your upcoming, current, and past rentals will appear here as plans take shape.</p></div> : <div className="empty-dashboard"><CalendarDays /><h3>No plans on the calendar.</h3><p>Your rental requests will show up here once you find something you love.</p><Link className="text-link" to="/browse">Explore the rentals <ArrowUpRight size={15} /></Link></div>}</section></div><aside className="dashboard-sidebar"><section className="dashboard-panel profile-panel"><span className="eyebrow">Your details</span><h2>A little about you.</h2><form onSubmit={saveProfile} className="dashboard-form"><label className="form-field"><span>Name</span><input value={profile.name} required minLength="2" maxLength="80" onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label className="form-field"><span>Email</span><input value={user.email} disabled /></label><label className="form-field"><span>Phone (optional)</span><input value={profile.phone} maxLength="30" onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label><button className="button button-teal button-full">Save profile</button></form></section><div className="demo-reminder"><Shield size={17} /><div><strong>Demo checkout</strong><p>Bookings are requests only. No card details or real payments are involved.</p></div></div></aside></div>}

    {user.role === "provider" && <div className="dashboard-columns provider-dashboard"><div className="dashboard-primary">
      <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">People are looking</span><h2>Rental requests</h2></div><span className="panel-count">{bookings.filter((booking) => booking.status === "pending").length} awaiting you</span></div>{bookings.length ? <div className="dashboard-booking-list">{bookings.map((booking) => <BookingRow key={booking._id} booking={booking} canManage onStatus={changeBooking} />)}</div> : <div className="empty-dashboard"><ClipboardList /><h3>Nothing to review yet.</h3><p>When someone requests your listing, their dates and request will appear here.</p></div>}</section>
      <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">Your neighbourhood shelf</span><h2>Your listings</h2></div><span className="panel-count">{products.length} items</span></div>{products.length ? <div className="provider-product-list">{products.map((product) => <article className="provider-product-row" key={product._id}><img src={imageFor(product)} alt="" /><div><strong>{product.title}</strong><span>{product.category} · {money(product.dailyPrice)} / day</span><Status status={product.isActive ? product.availabilityStatus : "inactive"} /></div><div className="provider-product-actions"><button onClick={() => beginEdit(product)}>Edit</button><button className="danger-action" aria-label={`Remove ${product.title}`} onClick={() => removeProduct(product._id)}><Trash2 size={16} /></button></div></article>)}</div> : <div className="empty-dashboard"><Package /><h3>Your shelf is waiting.</h3><p>Add something useful and let the sharing begin.</p></div>}</section>
    </div><aside className="dashboard-sidebar"><section className="dashboard-panel profile-panel" id="listing-form"><span className="eyebrow">{editing ? "Give it a refresh" : "Make someone’s day"}</span><h2>{editing ? "Edit your listing." : "Share something good."}</h2><form className="dashboard-form" onSubmit={saveProduct}><label className="form-field"><span>Item name</span><input required minLength="3" maxLength="120" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Sony mirrorless camera" /></label><label className="form-field"><span>Description</span><textarea required minLength="20" maxLength="3000" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What makes this item useful?" /></label><label className="form-field"><span>Category</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><div className="form-two-col"><label className="form-field"><span>Price per day (₹)</span><input type="number" min="1" max="1000000" required value={form.dailyPrice} onChange={(event) => setForm({ ...form, dailyPrice: event.target.value })} /></label><label className="form-field"><span>Deposit (₹)</span><input type="number" min="0" max="10000000" value={form.securityDeposit} onChange={(event) => setForm({ ...form, securityDeposit: event.target.value })} /></label></div><div className="form-two-col"><label className="form-field"><span>Condition</span><select value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })}>{["New", "Like new", "Good", "Fair"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-field"><span>Listing status</span><select value={form.availabilityStatus} onChange={(event) => setForm({ ...form, availabilityStatus: event.target.value })}><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label></div><label className="form-field"><span>Pickup location</span><input maxLength="120" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="City or neighbourhood" /></label><label className="form-field"><span>Image URL (optional)</span><input type="url" maxLength="1000" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://…" /></label><button className="button button-teal button-full">{editing ? "Save changes" : "Publish listing"} <ArrowUpRight size={15} /></button>{editing && <button className="button button-text button-full" type="button" onClick={() => { setEditing(""); setForm(initialProduct); }}>Cancel editing</button>}</form></section></aside></div>}

    {user.role === "admin" && <>
      <div className="admin-stats">{[[Users, "Community members", stats?.users], [Package, "Active listings", stats?.products], [CalendarDays, "Rental requests", stats?.bookings], [CircleDollarSign, "Pending requests", stats?.bookingStatuses?.pending || 0]].map(([Icon, label, value]) => <article className="stat-card" key={label}><span><Icon size={18} /></span><small>{label}</small><strong>{value ?? "—"}</strong></article>)}</div>
      <section className="dashboard-panel admin-panel">
        <div className="panel-heading"><div><span className="eyebrow">Status at a glance</span><h2>Booking status overview</h2></div></div>
        <div className="booking-status-overview">{Object.entries(stats?.bookingStatuses || {}).length ? Object.entries(stats.bookingStatuses).map(([status, count]) => <div key={status}><Status status={status} /><strong>{count}</strong></div>) : <p className="panel-empty">No booking requests have been made yet.</p>}</div>
      </section>
      <section className="dashboard-panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">Community accounts</span><h2>People on Rentix</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map((target) => <tr key={target._id}><td>{target.name}</td><td>{target.email}</td><td>{target.role}</td><td><Status status={target.isActive ? "active" : "inactive"} /></td><td><button className="table-action" disabled={target._id === user.id} onClick={() => toggleUser(target)}>{target.isActive ? "Deactivate" : "Reactivate"}</button></td></tr>)}</tbody></table></div></section>
      <section className="dashboard-panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">A thoughtful marketplace</span><h2>Product listings</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Listing</th><th>Provider</th><th>Daily price</th><th>Status</th><th>Action</th></tr></thead><tbody>{adminProducts.map((product) => <tr key={product._id}><td>{product.title}</td><td>{product.owner?.name || "—"}</td><td>{money(product.dailyPrice)}</td><td><Status status={product.isActive ? product.availabilityStatus : "inactive"} /></td><td><button className="table-action" onClick={() => toggleProduct(product)}>{product.isActive ? "Deactivate" : "Reactivate"}</button></td></tr>)}</tbody></table></div></section>
      <section className="dashboard-panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">Every request, in one place</span><h2>Booking overview</h2></div></div>{bookings.length ? <div className="dashboard-booking-list">{bookings.map((booking) => <BookingRow key={booking._id} booking={booking} canManage onStatus={changeBooking} />)}</div> : <p className="panel-empty">No booking requests have been made yet.</p>}</section>
    </>}
  </section>;
}
