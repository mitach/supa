import { Icons } from './Icons';

const HabitToggle = ({ label, value, onChange, streak, icon, isFocus }) => (
  <button
    onClick={() => onChange(!value)}
    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
      value
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
    } ${isFocus ? 'ring-1 ring-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]' : ''}`}
  >
    <div className="flex items-center gap-3">
      {icon && <span className="opacity-70">{icon}</span>}
      <span className="font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      {streak > 0 && (
        <div className="flex items-center gap-1 text-amber-400">
          <Icons.Flame />
          <span className="text-sm font-bold">{streak}</span>
        </div>
      )}
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          value ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
        }`}
      >
        {value && <Icons.Check />}
      </div>
    </div>
  </button>
);

export { HabitToggle };
