import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';

export default function NotFound() {
  return (
    <PageTransition>
      <section className="section auth">
        <h1 className="hero-title"><span className="accent">404</span></h1>
        <p className="lead">This page skipped leg day. It doesn't exist.</p>
        <Link to="/" className="btn btn-primary">Back home</Link>
      </section>
    </PageTransition>
  );
}
