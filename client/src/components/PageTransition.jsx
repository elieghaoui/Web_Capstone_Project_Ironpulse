// Every page slides in when it appears (CSS @keyframes page-in in global.css).
export default function PageTransition({ children }) {
  return <main className="page">{children}</main>;
}
