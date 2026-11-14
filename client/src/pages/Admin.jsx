import PageTransition from '../components/PageTransition.jsx';
import Reveal from '../components/Reveal.jsx';

const sections = [
  { title: 'Classes', text: 'Add, edit and remove classes from the timetable.' },
  { title: 'Trainers', text: 'Manage coach profiles and PT availability.' },
  { title: 'Plans', text: 'Change prices, limits and perks.' },
  { title: 'Bookings', text: 'See who booked what and how full each class is.' },
];

// Milestone 2 adds the admin API routes, Milestone 3 connects these panels.
export default function Admin() {
  return (
    <PageTransition>
      <section className="section">
        <h1 className="page-title">Admin panel</h1>
        <div className="grid-2">
          {sections.map((s, i) => (
            <Reveal key={s.title} className="card" delay={i * 0.08}>
              <h2>{s.title}</h2>
              <p className="muted">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
