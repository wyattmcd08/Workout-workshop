import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/utils/id'

export interface CoachMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const MAX_HISTORY = 40

interface CoachState {
  messages: CoachMessage[]
  addMessage: (role: 'user' | 'assistant', content: string) => CoachMessage
  reset: () => void
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (role, content) => {
        const message: CoachMessage = { id: createId(), role, content }
        set((state) => ({ messages: [...state.messages, message].slice(-MAX_HISTORY) }))
        return message
      },
      reset: () => set({ messages: [] }),
    }),
    { name: 'dialed-dawg-coach' },
  ),
)
