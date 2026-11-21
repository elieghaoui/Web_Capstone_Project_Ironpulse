import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import Reveal from '../components/Reveal.jsx';
import { useReveal } from '../hooks/useReveal.js';

const headline = ['FEEL', 'THE', 'PULSE.'];
const classNames = ['HIIT BURN', 'SPIN RUSH', 'POWER YOGA', 'PILATES', 'BOXING', 'STRENGTH LAB', 'CORE & MOBILITY'];

const stats = [
  { value: 7, label: 'class types' },
  { value: 4, label: 'expert trainers' },
  { value: 24, label: 'access on Pro and up', suffix: '/7' },
  { value: 5, label: 'membership plans' },
];

const features = [
  { title: 'Book in seconds', text: 'See live spots left and grab your place before the class fills up.' },
  { title: 'Train 1-on-1', text: 'Pick a coach, check their open slots and book a personal session.' },
  { title: 'One clear plan', text: 'From Basic to Athlete: classes and PT sessions included every month.' },
];

// Counts up from 0 to `to` the first time it scrolls into view.
function Counter({ to, suffix = '' }) {
  const [ref, visible] = useReveal();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const duration = 1200;
    const start = performance.now();
    let frame;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      setShown(Math.round(to * (1 - (1 - progress) ** 3))); // ease-out
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame); // cleanup (lecture 15)
  }, [visible, to]);

  return <span ref={ref}>{shown}{suffix}</span>;
}

export default function Home() {
  return (
    <PageTransition>
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        {/* aria-label: screen readers read "Feel the pulse." instead of the three separate words */}
        <h1 className="hero-title" aria-label="Feel the pulse.">
          {headline.map((word, i) => (
            <span key={word} aria-hidden="true" className={i === 2 ? 'word accent' : 'word'} style={{ animationDelay: `${i * 150}ms` }}>
              {word}
            </span>
          ))}
        </h1>

        {/* Heartbeat line that draws itself (stroke-dashoffset keyframes) */}
        <svg className="hero-pulse" viewBox="0 0 600 80" aria-hidden="true">
          <path
            d="M0 40 H200 L225 10 L255 70 L285 20 L305 55 L320 40 H600"
            pathLength="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="hero-sub fade-in" style={{ animationDelay: '900ms' }}>
          Classes that push you, coaches who know you, and plans that fit how you train.
        </p>

        <div className="hero-actions fade-in" style={{ animationDelay: '1100ms' }}>
          <Link to="/plans" className="btn btn-primary btn-lg">See plans</Link>
          <Link to="/classes" className="btn btn-ghost btn-lg">Class schedule</Link>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...classNames, ...classNames].map((name, i) => (
            <span key={i}>{name} <b>✦</b></span>
          ))}
        </div>
      </div>

      <section className="section stats">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 100} className="stat">
            <strong><Counter to={s.value} suffix={s.suffix} /></strong>
            <span>{s.label}</span>
          </Reveal>
        ))}
      </section>

      <section className="section">
        <Reveal><h2 className="section-title">Why IRONPULSE</h2></Reveal>
        <div className="grid-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 120} as="article" className="card card-lift">
              <span className="card-number">0{i + 1}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal className="section cta">
        <h2>Ready when you are.</h2>
        <Link to="/signup" className="btn btn-primary btn-lg">Create your account</Link>
      </Reveal>
    </PageTransition>
  );
}
