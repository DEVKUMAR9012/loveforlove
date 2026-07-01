// ─── Gradient Button ─────────────────────────────────────────────────────────
import { motion } from 'framer-motion'

/**
 * @param {object}    props
 * @param {'primary'|'glass'|'outline'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean}   [props.loading=false]
 * @param {boolean}   [props.fullWidth=false]
 * @param {string}    [props.className]
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.iconRight]
 */
const GradientButton = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  icon,
  iconRight,
  disabled,
  onClick,
  type = 'button',
  ...props
}) => {
  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
  }

  const variants = {
    primary: 'btn-primary',
    glass:   'btn-glass',
    outline: 'glass border border-pink-400/50 text-pink-400 hover:bg-pink-400/10 transition-all rounded-2xl font-semibold',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        inline-flex items-center justify-center rounded-2xl font-semibold
        ${className}
      `}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      {...props}
    >
      {loading ? (
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
        </svg>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </>
      )}
    </motion.button>
  )
}

export default GradientButton
