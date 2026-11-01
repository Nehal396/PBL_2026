import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div><Link className="brand footer-brand" to="/"><span className="brand-mark">r</span>rentix<span className="brand-period">.</span></Link><p>Good things, shared.<br />A little more access. A little less waste.</p></div>
        <div className="footer-links"><div><strong>Explore</strong><Link to="/browse">All rentals</Link><Link to="/browse?category=Cameras">Cameras</Link><Link to="/browse?category=Bikes%20and%20scooters">Bikes &amp; scooters</Link></div><div><strong>Community</strong><Link to="/register?role=provider">List an item <ArrowUpRight size={13} /></Link><Link to="/register">Create an account</Link><a href="mailto:hello@rentix.example">Get in touch</a></div></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Rentix. Built for sharing.</span><span>Rental checkout is a demonstration. No real payments are collected.</span></div>
    </footer>
  );
}
