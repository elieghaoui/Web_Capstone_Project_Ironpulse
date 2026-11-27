import { useState } from 'react';
import PageTransition from '../components/PageTransition.jsx';
import ClassesAdmin from '../components/admin/ClassesAdmin.jsx';
import TrainersAdmin from '../components/admin/TrainersAdmin.jsx';
import PlansAdmin from '../components/admin/PlansAdmin.jsx';
import BookingsAdmin from '../components/admin/BookingsAdmin.jsx';

const tabs = [
  { id: 'classes', label: 'Classes', Panel: ClassesAdmin },
  { id: 'trainers', label: 'Trainers', Panel: TrainersAdmin },
  { id: 'plans', label: 'Plans', Panel: PlansAdmin },
  { id: 'bookings', label: 'Bookings', Panel: BookingsAdmin },
];

// Admin panel: one page, the selected tab is state.
// Only admins get here (ProtectedRoute adminOnly), and the API checks again on every write.
export default function Admin() {
  const [tab, setTab] = useState('classes');
  const { Panel } = tabs.find((t) => t.id === tab);

  return (
    <PageTransition>
      <section className="section">
        <h1 className="page-title">Admin panel</h1>
        <div className="chips admin-tabs" role="tablist" aria-label="Admin sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === tab}
              className={t.id === tab ? 'chip active' : 'chip'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* key: switching tabs mounts a fresh panel, so it loads fresh data */}
        <div key={tab} className="fade-up" role="tabpanel">
          <Panel />
        </div>
      </section>
    </PageTransition>
  );
}
