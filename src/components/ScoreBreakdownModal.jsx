import { Modal } from './Modal';

const ScoreBreakdownModal = ({ isOpen, onClose, score, date }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Score Breakdown - ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
    >
      <div className="space-y-4">
        <div className="text-center py-4 bg-slate-800/50 rounded-xl">
          <div className="text-5xl font-bold text-amber-400 mb-1">{score.score}</div>
          <div className="text-slate-400">out of {score.maxScore} points</div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Habits (60 pts max)</h4>
          <div className="space-y-2">
            {score.breakdown.filter(b => !b.goal && !b.isBonus).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded-lg">
                <span className="text-slate-300">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={item.earned > 0 ? 'text-emerald-400' : 'text-slate-600'}>
                    {item.earned > 0 ? 'OK' : '--'}
                  </span>
                  <span className={`font-semibold ${item.earned > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                    +{item.earned}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Metrics (40 pts max)</h4>
          <div className="space-y-2">
            {score.breakdown.filter(b => b.goal !== undefined).map((item, i) => (
              <div key={i} className="py-2 px-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-amber-400 font-semibold">+{item.earned.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, item.percent)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-20 text-right">
                    {item.value || 0} / {item.goal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {score.breakdown.filter(b => b.isBonus).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Bonus Points</h4>
            <div className="space-y-2">
              {score.breakdown.filter(b => b.isBonus).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                  <span className="text-violet-300">{item.label}</span>
                  <span className="text-violet-400 font-semibold">+{item.earned}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800/30 rounded-xl p-4 mt-4">
          <h4 className="text-amber-400 text-sm font-semibold mb-2">Tips to improve</h4>
          <ul className="text-slate-400 text-sm space-y-1">
            {score.breakdown.filter(b => !b.isBonus && b.percent < 100).slice(0, 3).map((item, i) => (
              <li key={i}>- {item.label}: {item.percent < 50 ? 'Not logged or low' : 'Almost there!'}</li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export { ScoreBreakdownModal };
