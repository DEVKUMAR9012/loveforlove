// ─── Design System Showcase ──────────────────────────────────────────────────
// Visit /design to preview every token, component, and style
import { useState } from 'react'
import { motion } from 'framer-motion'
import FloatingOrbs from '../components/layout/FloatingOrbs'
import PageTransition from '../components/ui/PageTransition'

// ─── Section wrapper ─────────────────────────────────────────────────────────
const Section = ({ title, subtitle, children }) => (
  <motion.section
    className="mb-16"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-6">
      <h2 className="text-2xl font-bold gradient-text mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-white/40">{subtitle}</p>}
    </div>
    {children}
  </motion.section>
)

const Chip = ({ label, value, mono = false }) => (
  <div className="glass px-4 py-3 rounded-xl flex items-center justify-between gap-4">
    <span className="text-sm text-white/60">{label}</span>
    <span className={`text-sm font-semibold text-white/90 ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
)

// ─── Swatch ──────────────────────────────────────────────────────────────────
const Swatch = ({ color, name, hex, textDark = false }) => (
  <div className="flex flex-col gap-1.5">
    <div
      className="w-full h-14 rounded-xl border border-white/10 shadow-card"
      style={{ background: color }}
    />
    <span className="text-xs text-white/60">{name}</span>
    <span className="text-xs font-mono text-white/40">{hex}</span>
  </div>
)

// ─── Main Page ───────────────────────────────────────────────────────────────
const DesignPage = () => {
  const [inputVal, setInputVal] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <PageTransition>
      <div className="page-container">
        <FloatingOrbs />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">

          {/* ── Hero ─────────────────────────────────────────────────── */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="overline mb-3">Our Universe</p>
            <h1 className="display-2 gradient-text mb-4">Design System</h1>
            <p className="body-lg max-w-xl mx-auto">
              Pink + Sky Blue · Premium Glassmorphism · Mobile First
            </p>
          </motion.div>

          {/* ════════════════════════════════════════════════════════════
              SECTION 1 — COLOR PALETTE
              ════════════════════════════════════════════════════════════ */}
          <Section title="01 — Color Palette" subtitle="Brand tokens · Semantic · Dark surfaces">
            <div className="space-y-6">

              {/* Brand Pink */}
              <div>
                <p className="overline mb-3 text-pink-400">Brand Pink</p>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {[['50','#fff0f6'],['100','#ffdde9'],['200','#ffb8d2'],['300','#ff89b5'],['400','#ff6b9d'],['500','#ff3d7f'],['600','#ef1a60'],['700','#cc0a4a'],['800','#a80d3e'],['900','#8c1037']].map(([s,h]) => (
                    <Swatch key={s} color={h} name={s} hex={h} />
                  ))}
                </div>
              </div>

              {/* Sky Blue */}
              <div>
                <p className="overline mb-3 text-sky-400">Sky Blue</p>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {[['50','#f0f9ff'],['100','#e0f2fe'],['200','#b9e8fe'],['300','#7dd5fd'],['400','#4FACFE'],['500','#2196f3'],['600','#0284c7'],['700','#0369a1'],['800','#075985'],['900','#0c4a6e']].map(([s,h]) => (
                    <Swatch key={s} color={h} name={s} hex={h} />
                  ))}
                </div>
              </div>

              {/* Grape */}
              <div>
                <p className="overline mb-3" style={{ color: '#c850c0' }}>Grape Accent</p>
                <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                  {[['300','#ce9cff'],['400','#c850c0'],['500','#a855f7'],['600','#9333ea'],['700','#7e22ce'],['800','#6b21a8'],['900','#581c87']].map(([s,h]) => (
                    <Swatch key={s} color={h} name={s} hex={h} />
                  ))}
                </div>
              </div>

              {/* Dark Surfaces */}
              <div>
                <p className="overline mb-3 text-white/40">Dark Surfaces</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['Base','#0D0D1A'],['Surface','#13131F'],['Card','#1A1A2E'],['Muted','#2A2A3E']].map(([n,h]) => (
                    <Swatch key={n} color={h} name={n} hex={h} />
                  ))}
                </div>
              </div>

              {/* Gradients */}
              <div>
                <p className="overline mb-3 text-white/40">Gradients</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="h-16 rounded-xl bg-gradient-pink-blue" />
                  <div className="h-16 rounded-xl bg-gradient-pink-grape" />
                  <div className="h-16 rounded-xl bg-gradient-blue-grape" />
                  <div className="h-16 rounded-xl bg-gradient-tri" />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="h-10 rounded-xl bg-gradient-card-pink" />
                  <div className="h-10 rounded-xl bg-gradient-card-blue" />
                  <div className="h-10 rounded-xl bg-gradient-card-mix" />
                </div>
              </div>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 2 — TYPOGRAPHY
              ════════════════════════════════════════════════════════════ */}
          <Section title="02 — Typography" subtitle="Quicksand + DM Sans · Scale + Hierarchy">
            <div className="glass p-8 space-y-5">
              <div><p className="caption mb-1">Display 2 — DM Sans Bold</p>
                <h1 className="display-2 gradient-text">Our Universe</h1></div>
              <div className="divider-gradient" />
              <div><p className="caption mb-1">Heading 1 — 4xl Bold</p>
                <h1 className="heading-1">A private universe for two</h1></div>
              <div><p className="caption mb-1">Heading 2 — 3xl Bold</p>
                <h2 className="heading-2">Timeline of memories</h2></div>
              <div><p className="caption mb-1">Heading 3 — 2xl Semibold</p>
                <h3 className="heading-3">Add a new memory</h3></div>
              <div><p className="caption mb-1">Heading 4 — xl Semibold</p>
                <h4 className="heading-4">Gallery · 48 photos</h4></div>
              <div className="divider-gradient" />
              <div><p className="caption mb-1">Body Large</p>
                <p className="body-lg">Every moment we share becomes a star in our universe.</p></div>
              <div><p className="caption mb-1">Body Medium</p>
                <p className="body-md">Write a love letter, record a voice note, or plan your future goals.</p></div>
              <div><p className="caption mb-1">Body Small</p>
                <p className="body-sm">Last seen 3 minutes ago · 📍 Online</p></div>
              <div className="divider-gradient" />
              <div className="flex flex-wrap gap-4">
                <p className="overline">Overline Text</p>
                <p className="caption">Caption text</p>
                <code className="code-inline">coupleId</code>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="gradient-text text-2xl font-bold">Pink Blue</span>
                <span className="gradient-text-purple text-2xl font-bold">Pink Grape</span>
                <span className="gradient-text-tri text-2xl font-bold">Tri-color</span>
              </div>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 3 — GLASSMORPHISM CARDS
              ════════════════════════════════════════════════════════════ */}
          <Section title="03 — Glassmorphism Cards" subtitle="4 glass variants + gradient border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass p-6">
                <p className="overline mb-2">glass</p>
                <p className="body-sm">Subtle, default glass. Use for most cards.</p>
              </div>
              <div className="glass-strong p-6">
                <p className="overline mb-2">glass-strong</p>
                <p className="body-sm">Higher contrast. Use for modals, auth cards.</p>
              </div>
              <div className="glass-pink p-6">
                <p className="overline mb-2 text-pink-400">glass-pink</p>
                <p className="body-sm">Tinted pink variant. Hover for glow.</p>
              </div>
              <div className="glass-blue p-6">
                <p className="overline mb-2 text-sky-400">glass-blue</p>
                <p className="body-sm">Tinted blue variant. Hover for glow.</p>
              </div>
              <div className="card p-6">
                <p className="overline mb-2">card</p>
                <p className="body-sm">Dark surface card. No glass blur.</p>
              </div>
              <div className="card-gradient-border p-6">
                <p className="overline mb-2">card-gradient-border</p>
                <p className="body-sm">Glass + 1px gradient border via mask.</p>
              </div>
              <div className="feature-card p-6 col-span-full sm:col-span-1">
                <p className="overline mb-2">feature-card</p>
                <p className="body-sm">Hover me — lift + shadow effect.</p>
              </div>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 4 — BUTTONS
              ════════════════════════════════════════════════════════════ */}
          <Section title="04 — Buttons" subtitle="7 variants · 5 sizes · States">
            {/* Variants */}
            <div className="glass p-6 space-y-6">
              <div>
                <p className="caption mb-3">Variants</p>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-primary">Primary</button>
                  <button className="btn-secondary">Secondary</button>
                  <button className="btn-glass">Glass</button>
                  <button className="btn-outline">Outline</button>
                  <button className="btn-ghost">Ghost</button>
                  <button className="btn-danger">Danger</button>
                </div>
              </div>
              <div className="divider" />
              {/* Sizes */}
              <div>
                <p className="caption mb-3">Sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="btn-primary btn-xs">Extra Small</button>
                  <button className="btn-primary btn-sm">Small</button>
                  <button className="btn-primary btn-md">Medium</button>
                  <button className="btn-primary btn-lg">Large</button>
                  <button className="btn-primary btn-xl">X-Large</button>
                </div>
              </div>
              <div className="divider" />
              {/* States */}
              <div>
                <p className="caption mb-3">States</p>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-primary" disabled>Disabled</button>
                  <button className="btn-primary flex gap-2">
                    <span className="spinner-sm" />
                    Loading
                  </button>
                  <button className="btn-primary w-full">Full Width</button>
                </div>
              </div>
              <div className="divider" />
              {/* FAB */}
              <div>
                <p className="caption mb-3">FAB (Floating Action Button)</p>
                <div className="relative h-20 flex items-center gap-4">
                  <button
                    className="relative w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl"
                    style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--glow-pink)' }}
                  >
                    +
                  </button>
                  <p className="body-sm">Pink-blue gradient · Glow shadow · Spring hover</p>
                </div>
              </div>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 5 — INPUTS
              ════════════════════════════════════════════════════════════ */}
          <Section title="05 — Inputs" subtitle="Glass inputs · States · Sizes · Labels">
            <div className="glass p-6 space-y-5 max-w-lg">
              {/* Default */}
              <div>
                <label className="input-label" htmlFor="ds-input-default">Email address</label>
                <input id="ds-input-default" className="input" type="email" placeholder="you@example.com" />
                <p className="input-helper">We'll never share your email.</p>
              </div>

              {/* With icon */}
              <div>
                <label className="input-label" htmlFor="ds-input-search">Search memories</label>
                <div className="input-group">
                  <span className="input-icon-left text-lg">🔍</span>
                  <input id="ds-input-search" className="input pl-10" type="search" placeholder="Search…" />
                </div>
              </div>

              {/* Error state */}
              <div>
                <label className="input-label" htmlFor="ds-input-error">Password</label>
                <input id="ds-input-error" className="input input-error" type="password" defaultValue="123" />
                <p className="input-helper-error">Password must be at least 8 characters.</p>
              </div>

              {/* Success state */}
              <div>
                <label className="input-label" htmlFor="ds-input-success">Username</label>
                <input id="ds-input-success" className="input input-success" type="text" defaultValue="stargazer" />
                <p className="input-helper-success">Username is available!</p>
              </div>

              {/* Textarea */}
              <div>
                <label className="input-label" htmlFor="ds-textarea">Love letter</label>
                <textarea id="ds-textarea" className="textarea" rows={4} placeholder="Dear my love…" />
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <p className="caption">Input sizes</p>
                <input className="input input-sm" type="text" placeholder="Small input" />
                <input className="input" type="text" placeholder="Default input" />
                <input className="input input-lg" type="text" placeholder="Large input" />
              </div>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 6 — MODALS
              ════════════════════════════════════════════════════════════ */}
          <Section title="06 — Modals" subtitle="Glass modal · Drawer · Inline preview">
            <div className="glass p-6 space-y-4">
              <button className="btn-primary" onClick={() => setModalOpen(true)}>
                Open Modal ✨
              </button>
              <p className="body-sm">Also available: drawer (slide-up on mobile), .modal-sm, .modal-lg, .modal-xl</p>

              {/* Inline static preview */}
              <div className="relative rounded-3xl overflow-hidden" style={{ height: 320 }}>
                <div style={{ background: 'rgba(13,13,26,0.7)', backdropFilter: 'blur(8px)' }}
                     className="absolute inset-0 flex items-center justify-center">
                  <div className="modal w-80 pointer-events-none">
                    <div className="modal-header">
                      <span className="modal-title">Add Memory ✨</span>
                      <button className="modal-close">✕</button>
                    </div>
                    <div className="modal-body space-y-3 pb-2">
                      <input className="input input-sm" placeholder="Memory title…" readOnly />
                      <input className="input input-sm" type="date" readOnly />
                    </div>
                    <div className="modal-footer">
                      <button className="btn-ghost btn-sm">Cancel</button>
                      <button className="btn-primary btn-sm">Save Memory</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live modal */}
            {modalOpen && (
              <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
                <motion.div
                  className="modal"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="modal-header">
                    <span className="modal-title">Add a Memory 🌟</span>
                    <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
                  </div>
                  <div className="modal-body space-y-4">
                    <div>
                      <label className="input-label">Memory Title</label>
                      <input className="input" placeholder="Our first trip together…" />
                    </div>
                    <div>
                      <label className="input-label">Date</label>
                      <input className="input" type="date" />
                    </div>
                    <div>
                      <label className="input-label">Note</label>
                      <textarea className="textarea" rows={3} placeholder="Describe the memory…" />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                    <button className="btn-primary" onClick={() => setModalOpen(false)}>Save Memory ✨</button>
                  </div>
                </motion.div>
              </div>
            )}
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 7 — BADGES
              ════════════════════════════════════════════════════════════ */}
          <Section title="07 — Badges & Tags" subtitle="6 semantic variants + dot badge">
            <div className="glass p-6 flex flex-wrap gap-3">
              <span className="badge-pink">💌 Letters</span>
              <span className="badge-blue">📅 Timeline</span>
              <span className="badge-grape">🌠 Goals</span>
              <span className="badge-success">✓ Completed</span>
              <span className="badge-warning">⏳ Pending</span>
              <span className="badge-error">✕ Error</span>
              <span className="relative">
                <span className="badge-pink">Unread</span>
                <span className="badge-dot" />
              </span>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 8 — SHADOWS
              ════════════════════════════════════════════════════════════ */}
          <Section title="08 — Shadows" subtitle="Glow · Glass · Elevation">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ['glow-pink-sm','Shadow Pink SM'],
                ['glow-pink','Shadow Pink'],
                ['glow-pink-lg','Shadow Pink LG'],
                ['glow-blue-sm','Shadow Blue SM'],
                ['glow-blue','Shadow Blue'],
                ['glow-blue-lg','Shadow Blue LG'],
                ['glass','Shadow Glass'],
                ['glass-hover','Glass Hover'],
                ['modal','Modal Shadow'],
              ].map(([cls, label]) => (
                <div
                  key={cls}
                  className={`glass p-4 rounded-xl shadow-${cls}`}
                >
                  <p className="caption">{label}</p>
                  <p className="text-xs font-mono text-white/30 mt-1">shadow-{cls}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 9 — ALERTS
              ════════════════════════════════════════════════════════════ */}
          <Section title="09 — Alerts" subtitle="4 semantic alert styles">
            <div className="space-y-3 max-w-xl">
              <div className="alert-info">ℹ️ <span>Your partner is online right now!</span></div>
              <div className="alert-success">✅ <span>Memory saved successfully.</span></div>
              <div className="alert-warning">⚠️ <span>Your invite code expires in 2 hours.</span></div>
              <div className="alert-error">❌ <span>Failed to upload photo. Please try again.</span></div>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 10 — SKELETONS
              ════════════════════════════════════════════════════════════ */}
          <Section title="10 — Skeleton Loaders" subtitle="Shimmer loading states">
            <div className="glass p-6 space-y-4 max-w-sm">
              <div className="flex items-center gap-3">
                <div className="skeleton-avatar w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton-title w-3/4" />
                  <div className="skeleton-text w-1/2" />
                </div>
              </div>
              <div className="skeleton w-full h-32 rounded-xl" />
              <div className="space-y-2">
                <div className="skeleton-text w-full" />
                <div className="skeleton-text w-5/6" />
                <div className="skeleton-text w-2/3" />
              </div>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 11 — PROGRESS / SPINNERS
              ════════════════════════════════════════════════════════════ */}
          <Section title="11 — Progress & Spinners">
            <div className="glass p-6 space-y-5">
              <div>
                <p className="caption mb-2">Progress bar — 68%</p>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: '68%' }} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="caption mb-2">Spinners</p>
                  <div className="flex items-center gap-4">
                    <div className="spinner-sm" />
                    <div className="spinner-md" />
                    <div className="spinner-lg" />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 12 — AVATARS
              ════════════════════════════════════════════════════════════ */}
          <Section title="12 — Avatars">
            <div className="glass p-6 flex flex-wrap items-end gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="avatar avatar-xs text-white">A</div>
                <p className="caption">xs</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="avatar avatar-sm text-white">AB</div>
                <p className="caption">sm</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="avatar avatar-md text-white">💖</div>
                <p className="caption">md</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="avatar avatar-lg text-white">🌌</div>
                <p className="caption">lg</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="avatar avatar-xl text-white">💫</div>
                <p className="caption">xl</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="avatar avatar-lg avatar-ring text-white">💎</div>
                <p className="caption">ring</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="avatar-ring-gradient">
                  <div className="avatar avatar-lg text-white">⭐</div>
                </div>
                <p className="caption">gradient</p>
              </div>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════
              SECTION 13 — ANIMATIONS
              ════════════════════════════════════════════════════════════ */}
          <Section title="13 — Animations" subtitle="CSS keyframe animations">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                ['animate-float','🌌','Float'],
                ['animate-heart-beat','💖','Heart Beat'],
                ['animate-bounce-soft','✨','Bounce Soft'],
                ['animate-pulse-glow glass rounded-xl px-3 py-2','🔆','Pulse Glow'],
                ['animate-spin-slow','⭐','Spin Slow'],
                ['animate-float-alt','💫','Float Alt'],
                ['animate-bounce-xs','🌸','Bounce XS'],
                ['animate-pulse-soft','🌙','Pulse Soft'],
              ].map(([cls, emoji, label]) => (
                <div key={label} className="glass p-4 rounded-xl flex flex-col items-center gap-2">
                  <span className={`text-3xl ${cls}`}>{emoji}</span>
                  <p className="caption">{label}</p>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </PageTransition>
  )
}

export default DesignPage
