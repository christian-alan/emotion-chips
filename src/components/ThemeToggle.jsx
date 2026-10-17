const OPTIONS = [
  { id: 'classic', label: 'Classic', left: 3, width: 76 },
  { id: 'glass', label: 'Liquid Glass', left: 79, width: 104 },
];

export default function ThemeToggle({ value, onChange }) {
  const active = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0];

  return (
    <div
      role="group"
      aria-label="Theme"
      className="relative h-[34px] w-[186px] rounded-full [background:var(--toggle-track)] [box-shadow:var(--toggle-ring)]"
    >
      <div
        className="absolute top-[3px] h-7 rounded-full [background:var(--toggle-thumb)] [box-shadow:var(--toggle-thumb-ring)] transition-[left,width] duration-[450ms] ease-[cubic-bezier(.32,1.25,.5,1)] motion-reduce:transition-none"
        style={{ left: active.left, width: active.width }}
      />
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
          className="absolute top-[3px] h-7 cursor-pointer rounded-full text-[13px] font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f7bea]"
          style={{
            left: o.left,
            width: o.width,
            color: o.id === value ? 'var(--toggle-on)' : 'var(--toggle-off)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
