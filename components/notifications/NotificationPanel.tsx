'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Music, Sparkles } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { NotificationItem } from './NotificationItem'
import { GlowButton } from '@/components/GlowButton'
import { cn } from '@/lib/utils'

export function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    isPanelOpen,
    setPanelOpen,
    markAllAsRead,
    clearAll,
  } = useNotificationStore()

  if (!isPanelOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setPanelOpen(false)}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {/* Panel — full width on mobile, slide from right; scrollable list */}
      <motion.div
        initial={{ opacity: 0, x: 400, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 400, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 sm:top-16 sm:right-4 w-full sm:w-96 sm:max-w-[calc(100vw-2rem)] h-full sm:h-[calc(100vh-5rem)] sm:rounded-2xl z-50"
      >
        <div className="glass shadow-2xl h-full flex flex-col overflow-hidden glow-purple border border-purple-500/30 sm:rounded-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <Bell className="w-6 h-6 text-purple-400" />
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full glow-red"
                    />
                  )}
                </motion.div>
                <h2 className="text-xl font-bold text-gradient">Notifications</h2>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium glow-purple"
                  >
                    {unreadCount} new
                  </motion.span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close panel"
              >
                <span className="text-gray-400 text-xl">×</span>
              </motion.button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <GlowButton
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  glowColor="blue"
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                >
                  Mark all read
                </GlowButton>
                <GlowButton
                  onClick={clearAll}
                  glowColor="red"
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                >
                  Clear all
                </GlowButton>
              </div>
            )}
          </div>

          {/* Notifications List — scrollable on mobile, no overflow issues */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-0">
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center py-12"
                >
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="mb-4"
                  >
                    <Music className="w-16 h-16 text-gray-600 mx-auto" />
                  </motion.div>
                  <p className="text-gray-400 text-sm mb-2">No notifications yet</p>
                  <p className="text-gray-500 text-xs">
                    You&apos;ll see song requests here
                  </p>
                </motion.div>
              ) : (
                notifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  )
}
