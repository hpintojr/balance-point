"use client";

import { FormEvent, useMemo, useState } from "react";
import { packages } from "@/lib/packages";
import { heroReferenceDataUri, realLogoDataUri } from "@/lib/brand-assets";

type Slot = { start: string; label: string };

export default function Home() {
  const [packageId, setPackageId] = useState("balance-point-challenge");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sessionStart, setSessionStart] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const selectedPackage = useMemo(() => packages.find((p) => p.id === packageId)!, [packageId]);

  async function loadSlots(nextDate: string) {
    setDate(nextDate);
    setSessionStart("");
    setSlots([]);
    setError("");
    if (!nextDate) return;
    setLoadingSlots(true);
    try {
      const response = await fetch(`/api/availability?date=${encodeURIComponent(nextDate)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load availability.");
      setSlots(data.slots || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load availability.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!sessionStart) {
      setError("Choose an available first-session time.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          sessionStart,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          waiverAccepted: form.get("waiver") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Booking failed.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed.");
      setSubmitting(false);
    }
  }

  return (
    <main>
      <section className="approved-hero" id="top" aria-label="Balance Point Certified private motorcycle training">
        <img className="approved-hero-reference" src={heroReferenceDataUri} alt="" aria-hidden="true" />

        <div className="approved-nav-brand" aria-hidden="true">
          <img src={realLogoDataUri} alt="" />
          <div className="approved-wordmark">
            <strong><span>BALANCE</span> POINT</strong>
            <small>CERTIFIED</small>
          </div>
        </div>

        <div className="approved-main-logo" aria-hidden="true">
          <img src={realLogoDataUri} alt="" />
        </div>

        <nav className="approved-nav-links" aria-label="Primary navigation">
          <a href="#top">Home</a>
          <a href="#training">Training Packages</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#challenge">About</a>
          <a href="#book">FAQ</a>
          <a href="#book" className="approved-nav-cta">BOOK A SESSION</a>
        </nav>

        <a className="hero-click hero-click-book" href="#book" aria-label="Book a session" />
        <a className="hero-click hero-click-packages" href="#training" aria-label="View training packages" />

        <div className="sr-only">
          <h1>Find Your Balance Point</h1>
          <p>One-on-one motorcycle wheelie training built around progression, not pressure. Learn clutch-up technique, rear-brake control, clean technique, and build toward consistency.</p>
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
            <p>Each package is a level of progression. Your first session is booked online, then the remaining sessions are scheduled around your development and training plan.</p>
          </div>
          <div className="package-grid">
            {packages.map((pkg) => (
              <article className={`package-card ${pkg.featured ? "featured" : ""}`} key={pkg.id}>
                {pkg.featured && <div className="popular">MOST POPULAR</div>}
                <p className="eyebrow">{pkg.eyebrow}</p>
                <h3>{pkg.shortName}</h3>
                <p className="card-description">{pkg.description}</p>
                <div className="price"><span>$</span>{pkg.price}<small> package</small></div>
                <ul>{pkg.bullets.map((bullet) => <li key={bullet}><span>✓</span>{bullet}</li>)}</ul>
                <button className="button card-button" onClick={() => { setPackageId(pkg.id); document.getElementById("book")?.scrollIntoView({ behavior: "smooth" }); }}>
                  Choose {pkg.sessions === 1 ? "session" : `${pkg.sessions} sessions`}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="process shell" id="how-it-works">
        <p className="eyebrow">HOW IT WORKS</p>
        <div className="process-grid">
          <div><span>01</span><h3>Choose your level</h3><p>Pick the progression that fits where you are now and where you want to go.</p></div>
          <div><span>02</span><h3>Reserve your first session</h3><p>Select a live time from the training calendar and lock it in with a $20 deposit. The remaining balance is handled directly with the owner, including cash.</p></div>
          <div><span>03</span><h3>Train + review</h3><p>Private coaching, technique correction, and video feedback turn each session into the next step.</p></div>
          <div><span>04</span><h3>Earn the standard</h3><p>Certification is awarded when the required riding standards are demonstrated—not simply because sessions were completed.</p></div>
        </div>
      </section>

      <section className="booking-section" id="book">
        <div className="shell booking-layout">
          <div className="booking-copy">
            <p className="eyebrow">LOCK IN YOUR FIRST SESSION</p>
            <h2>Ready to train?</h2>
            <p>Choose your package, pick an available first-session time, and reserve your spot. A $20 deposit applies toward the package total.</p>
            <div className="selected-card">
              <span>Selected training</span>
              <strong>{selectedPackage.shortName}</strong>
              <div><b>${selectedPackage.price}</b> total <i>•</i> ${selectedPackage.deposit} deposit</div>
            </div>
            <div className="safety-note"><strong>Progression over pressure.</strong><br/>Riding skill develops differently for every person. Balance Point Certified does not guarantee that a rider will reach balance point within a specific number of sessions.</div>
          </div>

          <form className="booking-form" onSubmit={handleBooking}>
            <label>
              Training package
              <select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
                {packages.map((pkg) => <option value={pkg.id} key={pkg.id}>{pkg.name} — ${pkg.price}</option>)}
              </select>
            </label>
            <div className="field-row">
              <label>Full name<input name="name" required autoComplete="name" placeholder="Rider name" /></label>
              <label>Phone<input name="phone" required autoComplete="tel" placeholder="(555) 555-5555" /></label>
            </div>
            <label>Email<input type="email" name="email" required autoComplete="email" placeholder="you@example.com" /></label>
            <label>Choose a date<input type="date" value={date} onChange={(e) => loadSlots(e.target.value)} required /></label>

            <div className="time-field">
              <span className="field-label">Available first-session times</span>
              {loadingSlots && <p className="muted">Checking the training calendar…</p>}
              {!loadingSlots && date && slots.length === 0 && <p className="muted">No open times on this date. Try another day.</p>}
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button type="button" key={slot.start} className={sessionStart === slot.start ? "slot active" : "slot"} onClick={() => setSessionStart(slot.start)}>{slot.label}</button>
                ))}
              </div>
            </div>

            <fieldset>
              <legend>Reservation deposit</legend>
              <div className="choice static-choice"><span><strong>Pay ${selectedPackage.deposit} today</strong><small>Remaining ${selectedPackage.price - selectedPackage.deposit} is collected directly by Balance Point Certified. Cash is welcome.</small></span></div>
            </fieldset>

            <label className="waiver"><input type="checkbox" name="waiver" required /><span>I understand motorcycle stunt training involves inherent risk, I will follow instructor safety directions, and a full training waiver may be required before riding.</span></label>

            {error && <div className="form-error">{error}</div>}
            <button className="button primary submit" disabled={submitting}>{submitting ? "Opening secure checkout…" : "Continue to secure payment"}</button>
            <p className="microcopy">Only the $20 reservation deposit is processed online through Stripe. Your selected calendar time is held briefly while you complete checkout; the remaining balance is handled directly with the owner.</p>
          </form>
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
