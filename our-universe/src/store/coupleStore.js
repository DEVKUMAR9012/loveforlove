// ─── Couple Store ────────────────────────────────────────────────────────────
import { create } from 'zustand'

const useCoupleStore = create((set) => ({
  // ─── State ───────────────────────────────────────────────────────────────
  couple:    null,    // { coupleId, partner1, partner2, anniversary, startDate }
  partner:   null,    // The other person's profile
  loading:   false,
  error:     null,

  // ─── Actions ─────────────────────────────────────────────────────────────
  setCouple:  (couple)  => set({ couple }),
  setPartner: (partner) => set({ partner }),
  setLoading: (loading) => set({ loading }),
  setError:   (error)   => set({ error }),
  clear:      ()        => set({ couple: null, partner: null, error: null }),
}))

export default useCoupleStore
