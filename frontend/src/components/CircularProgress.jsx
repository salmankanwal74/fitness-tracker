// Dial/compass jaisa circular progress gauge.
// Usage: <CircularProgress percent={65} label="This Week" value="3/5" color="#1f9d8f" />
function CircularProgress({ percent, label, value, color = 'var(--primary)', size = 110 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="circular-gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track (background ring) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-input, #eef1f4)"
          strokeWidth={strokeWidth}
        />
        {/* Progress (actual value) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fontWeight="800"
          fill="var(--text-dark)"
        >
          {clamped}%
        </text>
        <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#8a99a3">
          {value}
        </text>
      </svg>
      <p className="circular-gauge-label">{label}</p>
    </div>
  );
}

export default CircularProgress;
