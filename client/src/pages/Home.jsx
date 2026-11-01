import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Camera, Check, ChevronRight, CircleDollarSign, Gamepad2, Leaf, PackageCheck, Projector, ShieldCheck, Sparkles, Timer, Bike } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { api } from "../services/api.js";

const categories = [
  { title: "Cameras", subtitle: "Capture the moment", icon: Camera },
  { title: "Gaming consoles", subtitle: "Play a little longer", icon: Gamepad2 },
  { title: "Projectors", subtitle: "Make it a movie night", icon: Projector },
  { title: "Bikes and scooters", subtitle: "Take the scenic route", icon: Bike }
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    api("/products?limit=4")
      .then(({ products: results }) => setProducts(results))
      .catch((requestError) => setError(requestError.message));
  }, []);

  function search(event) {
    event.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <section className="hero">
        <div className="hero-grain" />
        <div className="hero-copy">
          <div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> A better way to get what you need</div>
          <h1>More living.<br /><span>Less owning.</span></h1>
          <p>Find the right thing for the right moment. Rent quality gear nearby, from people who are happy to share.</p>
          <form className="hero-search" onSubmit={search}><Sparkles size={18} /><input aria-label="Search rentals" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you looking for?" /><button aria-label="Search"><ArrowRight size={19} /></button></form>
          <div className="hero-note"><span className="avatar-stack"><i>J</i><i>A</i><i>M</i></span><span>Loved by local sharers</span><span className="hero-stars">★★★★★</span></div>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1300&q=90" alt="Camera ready for a weekend adventure" />
          <div className="hero-floating-card"><span className="floating-icon"><Camera size={19} /></span><span><strong>Weekend ready</strong><small>Camera from ₹550 / day</small></span><ArrowUpRight size={17} /></div>
          <span className="hero-image-caption">A little more access. A lot more possibility.</span>
        </div>
        <a className="hero-scroll" href="#categories"><ArrowDown size={16} /> Scroll to explore</a>
        <div className="hero-index">01 <span /> 04</div>
      </section>

      <section className="trust-strip"><span>SHARE MORE, WASTE LESS</span><div><ShieldCheck size={18} /> Thoughtfully listed</div><div><PackageCheck size={18} /> Easy local pickup</div><div><CircleDollarSign size={18} /> Clear daily pricing</div></section>

      <section className="section section-categories" id="categories">
        <div className="section-heading"><div><span className="eyebrow">Explore the good stuff</span><h2>Find your next <em>“just for now.”</em></h2></div><Link className="text-link" to="/browse">Browse everything <ArrowUpRight size={16} /></Link></div>
        <div className="category-grid">{categories.map(({ title, subtitle, icon: Icon }, index) => <Link className={`category-card category-${index + 1}`} to={`/browse?category=${encodeURIComponent(title)}`} key={title}><span className="category-icon"><Icon size={20} /></span><span className="category-copy"><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight size={18} /></Link>)}</div>
      </section>

      <section className="section section-products">
        <div className="section-heading"><div><span className="eyebrow">Picked for curious people</span><h2>Good finds, <em>great stories.</em></h2><p className="section-intro">Useful things, ready when you are. Meet a few local favourites.</p></div><Link className="text-link" to="/browse">See all rentals <ArrowUpRight size={16} /></Link></div>
        {error ? <div className="inline-error">{error}</div> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <div className="products-loading"><span className="spinner" /> Finding available rentals…</div>}
      </section>

      <section className="how-section">
        <div className="how-intro"><span className="eyebrow eyebrow-light">The easy part</span><h2>Good things<br />happen in <em>three.</em></h2><p>That thing you need? It might already be closer than you think.</p><Link className="button button-light" to="/browse">Find your next rental <ArrowUpRight size={16} /></Link></div>
        <div className="how-steps"><div className="how-step"><span>01</span><div><Timer size={20} /><h3>Find your thing</h3><p>Explore useful gear from trusted local providers. Filter by what you need, when you need it.</p></div></div><div className="how-step"><span>02</span><div><Check size={20} /><h3>Pick your dates</h3><p>Choose your dates and send a request. The provider confirms availability before your plans are set.</p></div></div><div className="how-step"><span>03</span><div><Leaf size={20} /><h3>Make it yours (for a bit)</h3><p>Arrange pickup, enjoy the moment, then return it for the next person to enjoy.</p></div></div></div>
      </section>

      <section className="promise-section"><div className="promise-image"><img src="https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1200&q=85" alt="Friends out exploring together" /><span className="image-note">Borrow the gear.<br />Keep the memory.</span></div><div className="promise-copy"><span className="eyebrow">A lighter kind of ownership</span><h2>Access is the<br />new <em>upgrade.</em></h2><p>Some things are brilliant to have, but not every day. Renting gives good gear more life, helps you spend a little smarter, and keeps the cupboard clear for what’s next.</p><div className="promise-points"><span><Check size={16} /> Pay only for the time you use</span><span><Check size={16} /> Discover quality without the commitment</span><span><Check size={16} /> Help useful things get used more</span></div><Link className="text-link" to="/browse">Find something useful <ArrowRight size={16} /></Link></div></section>

      <section className="provider-cta"><div><span className="eyebrow eyebrow-light">Have something worth sharing?</span><h2>Your useful stuff<br />could be someone’s <em>next big thing.</em></h2><p>Give great gear a second life. List it, set your price, and connect with people nearby.</p></div><Link className="button button-light" to="/register?role=provider">Become a provider <ArrowUpRight size={16} /></Link><span className="cta-decoration">r</span></section>
    </>
  );
}
