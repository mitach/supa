const TabBar = ({ tabs, active, onChange }) => (
  <div className="flex bg-slate-800 rounded-xl p-1">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
          active === tab.id
            ? 'bg-amber-500 text-slate-900'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export { TabBar };
