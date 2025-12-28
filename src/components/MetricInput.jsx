const MetricInput = ({ label, value, onChange, placeholder, unit, goal, quickAdd, disabled }) => {
  const progress = goal && value ? Math.min(100, (value / goal) * 100) : 0;

  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        {goal && (
          <span className="text-xs text-slate-500">
            Goal: {goal}{unit}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />
        {unit && <span className="text-slate-500 text-sm">{unit}</span>}
      </div>
      {quickAdd && (
        <div className="flex gap-2 mt-3">
          {quickAdd.map((amount) => (
            <button
              key={amount}
              onClick={() => onChange((value || 0) + amount)}
              className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm py-2 rounded-lg transition-colors"
            >
              +{amount}
            </button>
          ))}
        </div>
      )}
      {goal && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-xs text-slate-500 mt-1">
            {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  );
};

export { MetricInput };
