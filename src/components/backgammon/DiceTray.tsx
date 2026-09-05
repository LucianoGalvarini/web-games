type DiceTrayProps = {
  dice: number[] | null
  diceTotal: number
  movesLeft: number
  canRoll: boolean
  player: 'white' | 'black'
  onRoll: () => void
}

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [24, 24],
    [50, 50],
    [76, 76],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
}

function Die({ value, used }: { value: number; used: boolean }) {
  return (
    <span className={`backgammon-die ${used ? 'is-used' : ''}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {PIPS[value]?.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="9" />)}
      </svg>
    </span>
  )
}

export function DiceTray({ dice, diceTotal, movesLeft, canRoll, player, onRoll }: DiceTrayProps) {
  const values = dice ? (dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : dice) : []
  const used = diceTotal - movesLeft

  return (
    <div className={`backgammon-dice is-${player}`}>
      {dice ? (
        <div className="backgammon-dice-row">
          {values.map((value, index) => (
            <Die key={index} value={value} used={index < used} />
          ))}
        </div>
      ) : (
        <button type="button" className="btn btn-gold" disabled={!canRoll} onClick={onRoll}>
          Tirar dados
        </button>
      )}
      {dice && movesLeft === 0 ? <p className="backgammon-dice-note">Sin jugadas con estos dados.</p> : null}
    </div>
  )
}
