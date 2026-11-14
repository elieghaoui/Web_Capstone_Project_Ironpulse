import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, animate } from 'framer-motion';
import PageTransition from '../components/PageTransition.jsx';
import Reveal from '../components/Reveal.jsx';

const headline = ['FEEL', 'THE', 'PULSE.'];
const classNames = ['HIIT BURN', 'SPIN RUSH', 'POWER YOGA', 'PILATES', 'BOXING', 'STRENGTH LAB', 'CORE & MOBILITY'];

const stats = [
  { value: 7, label: 'class types' },
  { value: 4, label: 'expert trainers' },
  { value: 24, label: 'hours a day', suffix: '/7' },
  { value: 5, label: 'membership plans' },
];

const features = [
  { title: 'Book in seconds', text: 'See live spots left and grab your place before the class fills up.' },
  { title: 'Train 1-on-1', text: 'Pick a coach, check their open slots and book a personal session.' },
  { title: 'One clear plan', text: 'From Basic to Athlete: classes and PT sessions included every month.' },
];

// Counts up from 0 to `to` when it scrolls into view.
function Counter({ to, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.6, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [inView, to]);

  return <span ref={ref}>{shown}{suffix}</span>;
}

export default function Home() {
  return (
    <PageTransition>
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <h1 className="hero-title">
          {headline.map((word, i) => (
            <motion.span
              key={word}
              className={i === 2 ? 'accent' : ''}
              initial={{ opacity: 0, y: 80, rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Heartbeat line that draws itself */}
        <svg className="hero-pulse" viewBox="0 0 600 80" aria-hidden="true">
          <motion.path
            d="M0 40 H200 L225 10 L255 70 L285 20 L305 55 L320 40 H600"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, delay: 0.5, ease: 'easeInOut' }}
          />
        </svg>

        <motion.p
          className="hero-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Classes that push you, coaches who know you, and plans that fit how you train.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Link to="/plans" className="btn btn-primary btn-lg">See plans</Link>
          <Link to="/classes" className="btn btn-ghost btn-lg">Class schedule</Link>
        </motion.div>
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
          <Reveal key={s.label} delay={i * 0.1} className="stat">
            <strong><Counter to={s.value} suffix={s.suffix} /></strong>
            <span>{s.label}</span>
          </Reveal>
        ))}
      </section>

      <section className="section">
        <Reveal><h2 className="section-title">Why IRONPULSE</h2></Reveal>
        <div className="grid-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.12}>
              <motion.article className="card" whileHover={{ y: -8 }}>
                <span className="card-number">0{i + 1}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal className="section cta">
        <h2>First class is on us.</h2>
        <Link to="/signup" className="btn btn-primary btn-lg">Create your account</Link>
      </Reveal>
    </PageTransition>
  );
}
