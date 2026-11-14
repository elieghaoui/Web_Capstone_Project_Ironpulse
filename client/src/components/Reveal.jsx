import { useReveal } from '../hooks/useReveal.js';

// Fades and slides its children in the first time they scroll into view.
// `delay` (in ms) staggers several reveals one after another.
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
