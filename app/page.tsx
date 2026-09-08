import Image from "next/image";
import { packages } from "@/lib/packages";

export default function Home() {
  return (
    <main>
      <header className="nav-wrap">
        <nav className="nav shell">
          <a className="brand" href="#top" aria-label="Balance Point Certified home">
            <Image src="/logo.svg" alt="Balance Point Certified" width={150} height={80} priority />
          </a>
          <div className="nav-links">
            <a href="#top">Home</a>
            <a href="#training">Training</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <a href="#book" className="nav-cta">Book a Session</a>
          </div>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />
        <div className="hero-grid shell">
          <div className="hero-copy">
            <p className="hero-overline">1-ON-1 MOTORCYCLE WHEELIE TRAINING</p>
            <h1>FIND YOUR<br/><span>BALANCE POINT.</span></h1>
            <p className="hero-lead">Private coaching focused on clutch-up technique, rear-brake control, clean progression, and consistency — built around your pace.</p>
            <div className="hero-actions">
              <a href="#book" className="button primary">Book a Session <span>→</span></a>
              <a href="#training" className="button ghost">View Packages</a>
            </div>
            <p className="hero-note">No guarantees. Real progress. Every rider develops differently.</p>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-logo-card">
              <Image src="/logo.svg" alt="" width={620} height={620} priority />
            </div>
            <div className="wheelie-art">
              <div className="wheel rear-wheel" />
              <div className="wheel front-wheel" />
              <div className="bike-frame" />
              <div className="rider-body" />
              <div className="rider-head" />
            </div>
            <div className="hero-tagline">PROGRESSION OVER <span>PRESSURE.</span></div>
          </div>
        </div>

        <div className="feature-strip shell">
          <div><b>◎</b><span><strong>Real Skills</strong><small>Clutch • Brake • Control</small></span></div>
          <div><b>↗</b><span><strong>Your Pace</strong><small>Progress, not promises</small></span></div>
          <div><b>⚡</b><span><strong>Experienced Coaching</strong><small>Built around you</small></span></div>
          <div><b>★</b><span><strong>Get Certified</strong><small>When standards are met</small></span></div>
        </div>
      </section>

      <section className="challenge-section shell" id="about">
        <p className="eyebrow">THE BALANCE POINT CHALLENGE</p>
        <h2>5 sessions. <span>One goal.</span><br/>Find your balance point.</h2>
        <p>Trust the process. The five-session challenge is designed to move riders through a structured progression toward balance point, but every rider develops at a different pace. The goal is meaningful progress — not a guarantee.</p>
      </section>

      <section className="training-section" id="training">
        <div className="shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">CHOOSE YOUR PROGRESSION</p>
              <h2>Stop buying “an hour.”<br/>Start building a skill.</h2>
            </div>
            <p>Each package is a level of progression. Start where you are, build control, and move forward at the pace that makes sense for you.</p>
          </div>

          <div className="package-grid">
            {packages.map((pkg) => (
              <article className={`package-card ${pkg.featured ? "featured" : ""}`} key={pkg.id}>
                {pkg.featured && <div className="popular">MOST POPULAR</div>}
                <p className="eyebrow">{pkg.eyebrow}</p>
                <h3>{pkg.shortName}</h3>
                <p className="card-description">{pkg.description}</p>
                <div className="price"><span>$</span>{pkg.price}<small> package</small></div>
                <ul>
                  {pkg.bullets.map((bullet) => <li key={bullet}><span>✓</span>{bullet}</li>)}
                </ul>
                <a className="button card-button" href="#book">Choose {pkg.sessions === 1 ? "session" : `${pkg.sessions} sessions`}</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="process shell">
        <p className="eyebrow">HOW IT WORKS</p>
        <div className="process-grid">
          <div><span>01</span><h3>Choose your level</h3><p>Pick the package that best fits your current skill level and training goal.</p></div>
          <div><span>02</span><h3>Reserve your session</h3><p>A $20 deposit reserves your spot. The remaining balance is handled directly with the owner, and cash is welcome.</p></div>
          <div><span>03</span><h3>Train + review</h3><p>Private coaching, technique correction, and video review turn each session into the next step.</p></div>
          <div><span>04</span><h3>Earn the standard</h3><p>Certification is awarded when the required riding standards are demonstrated.</p></div>
        </div>
      </section>

      <section className="booking-section" id="book">
        <div className="shell booking-layout">
          <div className="booking-copy">
            <p className="eyebrow">LOCK IN YOUR FIRST SESSION</p>
            <h2>Ready to train?</h2>
            <p>The booking experience is being finalized. For now, choose the program that fits your progression and get ready to reserve your first private session with a $20 deposit.</p>
            <div className="safety-note"><strong>Progression over pressure.</strong><br/>Motorcycle stunt training involves inherent risk. Results vary by rider, and no specific outcome is guaranteed within a set number of sessions.</div>
          </div>

          <div className="booking-preview">
            <div className="booking-badge">BOOKING PREVIEW</div>
            <h3>Your first session starts here.</h3>
            <div className="preview-field"><span>Training package</span><strong>Balance Point Challenge — 5 Sessions</strong></div>
            <div className="preview-row">
              <div className="preview-field"><span>Reservation deposit</span><strong>$20</strong></div>
              <div className="preview-field"><span>Remaining balance</span><strong>Paid directly</strong></div>
            </div>
            <div className="preview-field"><span>Payment preference</span><strong>Cash welcome</strong></div>
            <button className="button primary submit" type="button" disabled>Booking opening soon</button>
          </div>
        </div>
      </section>

      <footer id="contact">
        <div className="shell footer-grid">
          <div><Image src="/logo.svg" alt="Balance Point Certified" width={155} height={80} /><p>Private wheelie training. Progressive technique. Real control.</p></div>
          <div><a href="#training">Training</a><a href="#book">Book</a><a href="https://www.instagram.com/balance_point_certified" target="_blank" rel="noreferrer">Instagram</a></div>
        </div>
        <div className="shell footer-bottom">© {new Date().getFullYear()} Balance Point Certified. Motorcycle riding and stunt training involve inherent risk. Results vary by rider.</div>
      </footer>
    </main>
  );
}
