/** Żywe tło: rozmyte plamy światła + delikatna siatka. Czysto dekoracyjne. */
export function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-[22%] -left-[18%] h-[62vmax] w-[62vmax] rounded-full opacity-70 blur-[90px] animate-float"
        style={{ background: 'radial-gradient(circle at 30% 30%, #7c3aed55, transparent 62%)' }}
      />
      <div
        className="absolute top-[28%] -right-[24%] h-[58vmax] w-[58vmax] rounded-full opacity-60 blur-[100px] animate-float"
        style={{ background: 'radial-gradient(circle at 60% 40%, #22d3ee40, transparent 62%)', animationDelay: '-6s' }}
      />
      <div
        className="absolute -bottom-[28%] left-[12%] h-[54vmax] w-[54vmax] rounded-full opacity-50 blur-[110px] animate-float"
        style={{ background: 'radial-gradient(circle at 50% 50%, #f43f5e33, transparent 62%)', animationDelay: '-12s' }}
      />
      <div
        className="absolute inset-0 opacity-[0.16] dark:opacity-[0.13]"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%)',
        }}
      />
    </div>
  )
}
