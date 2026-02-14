'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { NotificationPanel } from './NotificationPanel'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { unreadCount, isPanelOpen, togglePanel } = useNotificationStore()

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePanel}
        className="relative p-3 rounded-xl glass hover:bg-white/10 transition-all duration-300 group"
        aria-label="Notifications"
      >
        <Bell className={cn(
          'w-5 h-5 transition-colors',
          isPanelOpen ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'
        )} />

        {/* Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center glow-red"
          >
            <motion.span
              key={unreadCount}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              className="text-xs font-bold text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          </motion.div>
        )}

        {/* Pulse animation for unread */}
        {unreadCount > 0 && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-red-500/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.button>

      <NotificationPanel />
    </>
  )
}
