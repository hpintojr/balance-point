"use client";

import { useMemo, useState } from "react";
import { packages } from "@/lib/packages";

const BOOKING_EMBED_URL = "https://crm.sulus.ai/b/training-session?embed=true";

function FeatureIcon({ type }: { type: "skills" | "progress" | "coach" | "cert" }) {
  if (type === "skills") {
    return <svg viewBox="-1 -1 26 26" aria-hidden="true"><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/><circle cx="12" cy="12" r="4"/></svg>;
  }
  if (type === "progress") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V13h4v7M10 20V8h4v12M16 20V4h4v16M3 20h18"/></svg>;
  }
  if (type === "coach") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v5c0 5.2-3.4 8.6-8 10-4.6-1.4-8-4.8-8-10V6l8-3z"/><path d="M8.5 12l2.2 2.2 4.8-5"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v8.5M15 3v4h3M9 9h6M9 12h4"/><circle cx="15.5" cy="17" r="2.5"/><path d="M14 19l-.5 2 2-1 2 1-.5-2"/></svg>;
}

export default function Home() {
  const [packageId, setPackageId] = useState("standard-private-lesson");
  const [menuOpen, setMenuOpen] = useState(false);
  const selectedPackage = useMemo(() => packages.find((p) => p.id === packageId)!, [packageId]);

  function handlePackageChange(nextPackageId: string) {
    setPackageId(nextPackageId);
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <header className="site-nav">
        <div className="nav-inner shell">
          <a className="nav-brand" href="#top" aria-label="Balance Point Certified home" onClick={closeMenu}>
            <img src="/nav-logo.png" alt="Balance Point Certified" className="nav-brand-mark" />
          </a>

          <nav className={`desktop-nav ${menuOpen ? "mobile-open" : ""}`} aria-label="Primary navigation">
            <a href="#top" onClick={closeMenu}>Home</a>
            <a href="#training" onClick={closeMenu}>Training Packages</a>
            <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
            <a href="#challenge" onClick={closeMenu}>About</a>
            <a href="#faq" onClick={closeMenu}>FAQ</a>
            <a href="#book" className="nav-book" onClick={closeMenu}>Book a Session</a>
          </nav>

          <button className="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <span/><span/><span/>
          </button>
        </div>
      </header>

      <section className="cinematic-hero" id="top" aria-label="Balance Point Certified private motorcycle training">
        <div className="hero-overlay" />
        <div className="hero-shell shell">
          <div className="hero-content">
            <img className="hero-art-logo" src="/hero-logo.jpg" alt="Balance Point Certified" />
            <h1><span className="hero-white">FIND YOUR</span><span className="hero-gradient">BALANCE POINT.</span></h1>
            <p className="hero-description">One-on-one motorcycle wheelie training built around progression, not pressure. Learn the clutch-up, rear brake control, clean technique, and build toward consistency.</p>
            <div className="hero-buttons">
              <a className="hero-button hero-button-primary" href="#book"><span className="calendar-icon">▣</span>Book a Session <span aria-hidden="true">→</span></a>
              <a className="hero-button hero-button-secondary" href="#training">View Packages <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>

        <div className="hero-feature-bar shell">
          <div><span className="feature-icon cyan"><FeatureIcon type="skills" /></span><p><strong>Real Skills</strong><small>Not shortcuts</small></p></div>
          <div><span className="feature-icon magenta"><FeatureIcon type="progress" /></span><p><strong>Progression</strong><small>At your pace</small></p></div>
          <div><span className="feature-icon cyan"><FeatureIcon type="coach" /></span><p><strong>Experienced</strong><small>One-on-one coaching</small></p></div>
          <div><span className="feature-icon magenta"><FeatureIcon type="cert" /></span><p><strong>Certification</strong><small>When standards are met</small></p></div>
        </div>
      </section>

      <section className="manifesto shell" id="challenge">
        <p className="eyebrow">THE BALANCE POINT CHALLENGE</p>
        <h2>5 sessions. <span>One goal.</span><br/>Find your balance point.</h2>
        <p>Trust the process. The five-session challenge is designed to move you through a structured progression toward balance point, but every rider develops at a different pace. The goal is real progress—not a fake guarantee.</p>
      </section>

      <section className="training-section" id="training">
        <div className="shell">
          <div className="section-head">
            <div><p className="eyebrow">CHOOSE YOUR PROGRESSION</p><h2>Stop buying “an hour.”<br/>Start building a skill.</h2></div>
            <p>Each session is booked online. Choose your own motorcycle or the school's R3 trainer bike when you book — the price is the same either way.</p>
          </div>
          <div className="package-grid">
            {packages.map((pkg) => (
              <article className={`package-card ${pkg.featured ? "featured" : ""}`} key={pkg.id}>
                {pkg.featured && <div className="popular">MOST POPULAR</div>}
                <p className="eyebrow">{pkg.eyebrow}</p>
                <h3>{pkg.shortName}</h3>
                <p className="card-description">{pkg.description}</p>
                <div className="price"><span>$</span>{pkg.price}<small> / {pkg.durationMinutes} min</small></div>
                <ul>{pkg.bullets.map((bullet) => <li key={bullet}><span>✓</span>{bullet}</li>)}</ul>
                <button className="button card-button" onClick={() => { handlePackageChange(pkg.id); document.getElementById("book")?.scrollIntoView({ behavior: "smooth" }); }}>
                  Book this session
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="process shell" id="how-it-works">
        <p className="eyebrow">HOW IT WORKS</p>
        <div className="process-grid">
          <div><span>01</span><h3>Choose your session</h3><p>Pick the session length and price that fits where you are now and where you want to go.</p></div>
          <div><span>02</span><h3>Reserve your time</h3><p>Pick a live time on the training calendar, tell us which bike you're riding, and book. Pay at your session — cash is welcome — or reserve online with a $20 deposit when that option is on.</p></div>
          <div><span>03</span><h3>Train + review</h3><p>Private coaching, technique correction, and video feedback turn each session into the next step.</p></div>
          <div><span>04</span><h3>Earn the standard</h3><p>Certification is awarded when the required riding standards are demonstrated—not simply because sessions were completed.</p></div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="shell">
          <div className="section-head faq-head"><div><p className="eyebrow">FAQ</p><h2>Before you ride.</h2></div><p>Clear expectations before the first clutch-up.</p></div>
          <div className="faq-grid">
            <article><h3>Is balance point guaranteed in five sessions?</h3><p>No. The five-session Challenge is a structured goal, not a guarantee. Every rider progresses differently.</p></article>
            <article><h3>Can I use the school's bike?</h3><p>Yes. When you book, choose the school's R3 trainer bike or your own motorcycle. The session price stays the same either way; because the trainer bike is shared, your actual seat time on it is shorter than the full session.</p></article>
            <article><h3>How do I pay?</h3><p>Book your time online and pay at your session — cash is welcome. An optional $20 online reservation deposit can be added later; the package balance is always settled directly with the owner.</p></article>
          </div>
        </div>
      </section>

      <section className="booking-section" id="book">
        <div className="shell booking-layout">
          <div className="booking-copy">
            <p className="eyebrow">LOCK IN YOUR SESSION</p>
            <h2>Ready to train?</h2>
            <p>Pick your session, your bike, and your time in the booking calendar. Pay at your session — cash is welcome.</p>
            <div className="selected-card">
              <span>Starting point</span>
              <strong>{selectedPackage.shortName}</strong>
              <div>
                <b>${selectedPackage.price}</b> total <i>•</i> {selectedPackage.durationMinutes} min
              </div>
            </div>
            <div className="package-quicklinks">
              {packages.map((pkg) => (
                <button type="button" key={pkg.id} className={pkg.id === packageId ? "quicklink active" : "quicklink"} onClick={() => handlePackageChange(pkg.id)}>
                  {pkg.shortName}
                </button>
              ))}
            </div>
            <div className="safety-note"><strong>Progression over pressure.</strong><br/>Riding skill develops differently for every person. Balance Point Certified does not guarantee that a rider will reach balance point within a specific number of sessions.</div>
          </div>

          <div className="booking-form booking-embed">
            <iframe
              src={BOOKING_EMBED_URL}
              width="100%"
              height="900"
              style={{ border: "none", borderRadius: "12px", display: "block" }}
              title="Book a training session with Balance Point Certified"
            />
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-grid">
          <div><strong>Balance Point Certified</strong><p>Private wheelie training. Progressive technique. Real control.</p></div>
          <div><a href="#training">Training</a><a href="#book">Book</a><a href="https://www.instagram.com/balance_point_certified" target="_blank" rel="noreferrer">Instagram</a></div>
        </div>
        <div className="shell footer-bottom">© {new Date().getFullYear()} Balance Point Certified. Motorcycle riding and stunt training involve inherent risk. Results vary by rider.</div>
      </footer>
    </main>
  );
}
