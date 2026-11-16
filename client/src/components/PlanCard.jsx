import { Notice } from './Status.jsx';

function describeCount(n, word) {
  if (n === null || n === undefined) return `Unlimited ${word}`;
  if (n === 0) return `No ${word}`;
  return `${n} ${word} / 30 days`;
}

// One plan on the Plans page. The page owns the state; this card just shows it.
export default function PlanCard({ plan, isCurrent, busy, notice, onChoose, delay = 0 }) {
  let className = 'plan-card pop-in';
  if (plan.name === 'Elite') className += ' featured';
  if (isCurrent) className += ' current';

  return (
    <article className={className} style={{ animationDelay: `${delay}ms` }}>
      {isCurrent && <span className="badge badge-success">Your plan</span>}
      {!isCurrent && plan.name === 'Elite' && <span className="badge">Most popular</span>}
      <h2>{plan.name}</h2>
      <p className="price">
        ${plan.priceMonthly}<span>/month</span>
      </p>
      <ul>
        <li>{describeCount(plan.classesPerMonth, 'group classes')}</li>
        <li>{describeCount(plan.ptSessionsPerMonth, 'PT sessions')}</li>
        {plan.perks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-primary"
        disabled={isCurrent || busy}
        onClick={() => onChoose(plan)}
        aria-label={`Choose the ${plan.name} plan`}
      >
        {isCurrent ? 'Current plan' : busy ? 'Saving…' : 'Choose plan'}
      </button>
      {notice && <Notice type={notice.type}>{notice.text}</Notice>}
    </article>
  );
}
