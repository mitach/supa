const Card = ({ children, className = '', onClick }) => (
  <div
    className={`bg-slate-800/50 rounded-2xl border border-slate-700/50 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export { Card };
