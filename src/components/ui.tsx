import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { tap } from '@/lib/native'

export function PageHeader({
  title,
  subtitle,
  back,
  right,
  eyebrow,
}: {
  title: ReactNode
  subtitle?: ReactNode
  back?: boolean
  right?: ReactNode
  eyebrow?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="safe-top px-5 pt-6 pb-4 md:px-8 md:pt-10">
      <div className="flex items-start gap-3">
        {back && (
          <button
            onClick={() => {
              tap()
              navigate(-1)
            }}
            aria-label="Wstecz"
            className="press focus-ring glass mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:text-ink"
          >
            <Icon name="back" size={18} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
              {eyebrow}
            </div>
          )}
          <h1 className="text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.02em] md:text-4xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  )
}

export function Section({
  title,
  action,
  children,
  icon,
}: {
  title: string
  icon?: IconName
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mt-7 first:mt-0">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-5 md:px-8">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
          {icon && <Icon name={icon} size={15} />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Chip({
  children,
  active,
  onClick,
  tone = 'default',
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  tone?: 'default' | 'accent'
}) {
  const Comp = onClick ? 'button' : 'span'
  return (
    <Comp
      onClick={onClick}
      className={`press focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] ${
        active
          ? 'border-transparent bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] text-ink'
          : tone === 'accent'
            ? 'border-line-strong text-accent'
            : 'border-line text-muted hover:text-ink'
      }`}
    >
      {children}
    </Comp>
  )
}

export function IconButton({
  name,
  label,
  onClick,
  active,
  size = 'md',
}: {
  name: IconName
  label: string
  onClick?: () => void
  active?: boolean
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`press focus-ring glass grid ${dim} place-items-center rounded-full ${
        active ? 'text-rose-400' : 'text-muted hover:text-ink'
      }`}
    >
      <Icon name={name} size={size === 'sm' ? 16 : 18} />
    </button>
  )
}

export function EmptyState({
  icon = 'sparkles',
  title,
  text,
  action,
}: {
  icon?: IconName
  title: string
  text?: string
  action?: ReactNode
}) {
  return (
    <div className="mx-5 my-10 flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-12 text-center md:mx-8">
      <span className="glass mb-4 grid h-14 w-14 place-items-center rounded-2xl text-accent">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="text-[15px] font-medium">{title}</h3>
      {text && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  icon,
  full,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'glass' | 'danger'
  icon?: IconName
  full?: boolean
  type?: 'button' | 'submit'
}) {
  const styles = {
    primary:
      'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-900/25 border-transparent',
    glass: 'glass text-ink',
    ghost: 'border-transparent text-muted hover:text-ink',
    danger: 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      className={`press focus-ring inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-[13.5px] font-medium ${styles} ${
        full ? 'w-full' : ''
      }`}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  )
}

export function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <div className="text-[1.35rem] font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-faint">{label}</div>
    </div>
  )
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-6 md:bottom-10">
      <div className="glass-strong animate-rise rounded-full px-4 py-2.5 text-[13px] shadow-[var(--shadow)]">
        {message}
      </div>
    </div>
  )
}
