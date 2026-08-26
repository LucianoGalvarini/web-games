type LigaHpProps = {
  hp: number
  max: number
  showNum?: boolean
  labeled?: boolean
  stacked?: boolean
}

export function LigaHp({ hp, max, showNum = true, labeled = false, stacked = false }: LigaHpProps) {
  const ratio = max <= 0 ? 0 : hp / max
  const tone = ratio > 0.5 ? 'ok' : ratio > 0.2 ? 'mid' : 'low'
  return (
    <span className={`liga-hp${stacked ? ' is-stack' : ''}`}>
      {labeled ? <span className="liga-hp-lab">PS</span> : null}
      <span className="liga-hp-track">
        <span className={`liga-hp-fill is-${tone}`} style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }} />
      </span>
      {showNum ? (
        <span className="liga-hp-num">
          {hp}/{max}
        </span>
      ) : null}
    </span>
  )
}
