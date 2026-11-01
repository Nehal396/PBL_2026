import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Leaf } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { signIn, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState({ name: "", email: "", password: "", role: searchParams.get("role") === "provider" ? "provider" : "customer" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) await register(values);
      else await signIn({ email: values.email, password: values.password });
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page"><div className="auth-art"><span className="brand auth-brand"><span className="brand-mark">r</span>rentix<span className="brand-period">.</span></span><div className="auth-art-copy"><span className="eyebrow eyebrow-light"><Leaf size={14} /> A little more shared</span><h1>Good gear.<br /><em>Good people.</em><br />Good plans.</h1><p>Make room for more of what matters, without having to own it all.</p></div><span className="auth-art-bottom">ACCESS MORE, OWN LESS.</span></div>
      <div className="auth-form-side"><div className="auth-form-wrap"><Link to="/" className="auth-back">← Back to Rentix</Link><span className="eyebrow">{isRegister ? "Your next good thing" : "Welcome back"}</span><h2>{isRegister ? "Make yourself at home." : "Good to see you again."}</h2><p>{isRegister ? "Join a community that believes useful things are better shared." : "Sign in to pick up where you left off."}</p>
        <form className="auth-form" onSubmit={submit}>
          {isRegister && <><label className="form-field"><span>Your name</span><input autoComplete="name" required minLength="2" maxLength="80" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="Alex Morgan" /></label><label className="form-field"><span>I’m here as a…</span><select value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value })}><option value="customer">Customer — I want to rent</option><option value="provider">Provider — I want to share</option></select></label></>}
          <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" required maxLength="254" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" /></label>
          <label className="form-field"><span>Password</span><span className="password-input"><input type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 8 : undefined} maxLength="128" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder={isRegister ? "At least 8 characters" : "Enter your password"} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-teal button-full auth-submit" disabled={busy}>{busy ? "One moment…" : isRegister ? "Create your account" : "Sign in"} <ArrowRight size={16} /></button>
        </form><div className="auth-switch">{isRegister ? "Already part of the neighbourhood?" : "New to Rentix?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></div><p className="auth-privacy">Your account is secured with an HTTP-only session cookie. Demo checkouts never collect payment details.</p>
      </div></div>
    </section>
  );
}
