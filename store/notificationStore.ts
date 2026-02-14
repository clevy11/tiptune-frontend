import { create } from 'zustand'
import type { Notification, SongRequest } from '@/lib/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isPanelOpen: boolean
  
  // Actions
  addNotification: (notification: Notification) => void
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  removeNotification: (id: number) => void
  clearAll: () => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
  
  // Helper to create notification from song request
  addSongRequestNotification: (songRequest: SongRequest) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isPanelOpen: false,

  addNotification: (notification) => {
    set((state) => {
      // Avoid duplicates
      const exists = state.notifications.some((n) => n.id === notification.id)
      if (exists) return state
      
      const newNotifications = [notification, ...state.notifications].slice(0, 50) // Keep last 50
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter((n) => !n.isRead).length,
      }
    })
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      }
    })
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, isRead: true }))
      return {
        notifications: updated,
        unreadCount: 0,
      }
    })
  },

  removeNotification: (id) => {
    set((state) => {
      const filtered = state.notifications.filter((n) => n.id !== id)
      return {
        notifications: filtered,
        unreadCount: filtered.filter((n) => !n.isRead).length,
      }
    })
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    })
  },

  togglePanel: () => {
    set((state) => ({
      isPanelOpen: !state.isPanelOpen,
    }))
  },

  setPanelOpen: (open) => {
    set({ isPanelOpen: open })
  },

  addSongRequestNotification: (songRequest) => {
    const state = get()
    // Dedupe: do not add if we already have a notification for this request
    const exists = state.notifications.some(
      (n) => n.songRequest?.id === songRequest.id
    )
    if (exists) return

    const notification: Notification = {
      id: songRequest.id,
      message: `New song request: ${songRequest.song.title} by ${songRequest.song.artist}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      type: 'song_request',
      songRequest,
    }
    get().addNotification(notification)
  },
}))
