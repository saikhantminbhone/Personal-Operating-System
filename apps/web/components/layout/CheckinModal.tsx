'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store/useAppStore'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ENERGY_META } from '@/lib/utils'

export function CheckinModal() {
  const { activeModal, setModal, showToast } = useAppStore()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)

  async function handleCheckin(level: number) {
    setLoading(true)
    try {
      await api.post('/auth/checkin', { energyLevel: level })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      setModal(null)
      showToast(`Energy set to ${ENERGY_META[level].label} 🔥`)
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={activeModal === 'checkin'} onClose={() => setModal(null)} title="Daily Check-In">
      <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b', marginBottom: 16 }}>
        How is your energy right now?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ENERGY_META.map((e, i) => (
          <button
            key={i}
            onClick={() => handleCheckin(i)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 16px', borderRadius: 10,
              border: `1px solid ${e.color}33`,
              background: `${e.color}0a`,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              textAlign: 'left', width: '100%',
              minHeight: 60,
            }}
          >
            <span style={{ fontSize: 22 }}>{e.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: e.color }}>
                {e.label}
              </div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b', marginTop: 2 }}>
                {['Rest mode — handle admin tasks', 'Light tasks and planning', 'Normal productive work', 'Deep work and hard problems'][i]}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}
