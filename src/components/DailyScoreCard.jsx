import { Card } from './Card';

const DailyScoreCard = ({ score, weeklyAvg, lastWeekAvg, onShowBreakdown }) => {
  const diff = weeklyAvg - lastWeekAvg;
  const diffText = diff > 0 ? `+${diff}` : diff.toString();
  const diffColor = diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400';

  const gradeColors = {
    S: 'from-amber-400 to-yellow-300',
    A: 'from-emerald-400 to-teal-300',
    B: 'from-blue-400 to-cyan-300',
    C: 'from-violet-400 to-purple-300',
    D: 'from-orange-400 to-amber-300',
    F: 'from-red-400 to-rose-300',
  };

  const gradeEmoji = {
    S: 'S+',
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    F: 'F',
  };

  const getMessage = (s) => {
    if (s >= 90) return "Legendary day!";
    if (s >= 80) return "Crushing it!";
    if (s >= 70) return "Solid progress!";
    if (s >= 60) return "Good effort!";
    if (s >= 50) return "Keep pushing!";
    return "Tomorrow is a new day";
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
      onClick={onShowBreakdown}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-slate-700"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(score.percent / 100) * 226} 226`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-2xl font-bold bg-gradient-to-r ${gradeColors[score.grade]} bg-clip-text text-transparent`}
            >
              {score.score}
            </span>
            <span className="text-xs text-slate-500">/ {score.maxScore}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-lg font-bold bg-gradient-to-r ${gradeColors[score.grade]} bg-clip-text text-transparent`}
            >
              Grade {score.grade}
            </span>
            <span>{gradeEmoji[score.grade]}</span>
          </div>
          <p className="text-slate-400 text-sm mb-2">{getMessage(score.score)}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Weekly avg</span>
            <span className="text-white font-semibold">{weeklyAvg}</span>
            <span className={diffColor}>({diffText})</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export { DailyScoreCard };
