import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { api } from "../services/api.js";

const categories = ["All categories", "Cameras", "Gaming consoles", "Projectors", "Bikes and scooters", "Electronics", "Other consumer goods"];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
    available: searchParams.get("available") === "true"
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams(Object.entries(filters).filter(([key, value]) => value && value !== "newest" && !(key === "available" && value === false)));
    query.set("page", searchParams.get("page") || "1");
    api(`/products?${query}`)
      .then(({ products: results, pagination }) => {
        setProducts(results);
        setMeta(pagination);
        setSearchParams(Object.fromEntries(query.entries()), { replace: true });
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [filters, searchParams.get("page")]);

  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setSearchParams((current) => { current.delete("page"); return current; });
  }

  return (
    <section className="browse-page">
      <div className="browse-heading"><div><span className="eyebrow">The neighbourhood shelf</span><h1>Find a little <em>something.</em></h1><p>Good gear for the plans you’re making.</p></div><span className="browse-count">{meta.total} thoughtful finds</span></div>
      <form className="browse-toolbar" onSubmit={(event) => event.preventDefault()}>
        <label className="browse-search"><Search size={18} /><input value={filters.q} onChange={(event) => update("q", event.target.value)} placeholder="Search cameras, bikes, projectors…" /><button type="button" aria-label="Clear search" onClick={() => update("q", "")}><X size={15} /></button></label>
        <label className="filter-select"><SlidersHorizontal size={16} /><select aria-label="Category" value={filters.category} onChange={(event) => update("category", event.target.value)}>{categories.map((category) => <option key={category} value={category === "All categories" ? "" : category}>{category}</option>)}</select></label>
        <label className="filter-select"><span className="filter-rupee">₹</span><input aria-label="Minimum daily price" type="number" min="0" placeholder="Min / day" value={filters.minPrice} onChange={(event) => update("minPrice", event.target.value)} /></label>
        <label className="filter-select"><span className="filter-rupee">₹</span><input aria-label="Maximum daily price" type="number" min="0" placeholder="Max / day" value={filters.maxPrice} onChange={(event) => update("maxPrice", event.target.value)} /></label>
        <select className="sort-select" aria-label="Sort products" value={filters.sort} onChange={(event) => update("sort", event.target.value)}><option value="newest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
        <label className="available-toggle"><input type="checkbox" checked={filters.available} onChange={(event) => update("available", event.target.checked)} /><span>Available</span></label>
      </form>
      {error ? <div className="state-card error-state"><h2>We couldn’t load the rentals.</h2><p>{error}</p></div> : loading ? <div className="products-loading"><span className="spinner" /> Gathering the good stuff…</div> : products.length ? <>
        <div className="product-grid browse-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>
        {meta.pages > 1 && <div className="pagination"><button disabled={meta.page <= 1} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(meta.page - 1) })}>Previous</button><span>Page {meta.page} of {meta.pages}</span><button disabled={meta.page >= meta.pages} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(meta.page + 1) })}>Next</button></div>}
      </> : <div className="state-card"><span className="state-icon"><Search /></span><h2>No matches just yet.</h2><p>Try a different search or clear a filter to see more local finds.</p><button className="button button-dark" onClick={() => { setFilters({ q: "", category: "", minPrice: "", maxPrice: "", sort: "newest", available: false }); setSearchParams({}); }}>Clear filters</button></div>}
    </section>
  );
}
