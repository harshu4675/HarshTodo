export function KeyCombo({ keys }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd key={`${k}-${i}`}>{k}</kbd>
      ))}
    </span>
  )
}
