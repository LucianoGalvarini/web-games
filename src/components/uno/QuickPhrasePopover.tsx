import { QUICK_PHRASES } from '../../uno/protocol'

type QuickPhrasePopoverProps = {
  onPick: (phrase: string) => void
  onClose: () => void
}

export function QuickPhrasePopover({ onPick, onClose }: QuickPhrasePopoverProps) {
  return (
    <div className="uno-phrase-popover" onMouseLeave={onClose}>
      {QUICK_PHRASES.map((phrase) => (
        <button
          key={phrase}
          type="button"
          className="uno-phrase-option"
          onClick={(e) => {
            e.stopPropagation()
            onPick(phrase)
          }}
        >
          {phrase}
        </button>
      ))}
    </div>
  )
}
