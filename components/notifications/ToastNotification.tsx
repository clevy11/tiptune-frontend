'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Music, X } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { useEffect } from 'react'
import type { Notification } from '@/lib/types'

const TOAST_DURATION = 6000 // 6 seconds

export function ToastNotification() {
  const { notifications, removeNotification } = useNotificationStore()
  
  // Get unread notifications for toast display
  const unreadNotifications = notifications.filter((n) => !n.isRead).slice(0, 3)

  useEffect(() => {
    // Auto-dismiss after duration
    unreadNotifications.forEach((notification) => {
      const timer = setTimeout(() => {
        removeNotification(notification.id)
      }, TOAST_DURATION)

      return () => clearTimeout(timer)
    })
  }, [unreadNotifications, removeNotification])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {unreadNotifications.map((notification, index) => (
          <ToastItem
            key={notification.id}
            notification={notification}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  notification: Notification
  index: number
}

function ToastItem({ notification, index }: ToastItemProps) {
  const { removeNotification, markAsRead } = useNotificationStore()

  const handleClose = () => {
    markAsRead(notification.id)
    removeNotification(notification.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
        delay: index * 0.1,
      }}
      className="pointer-events-auto w-96 max-w-[calc(100vw-2rem)]"
    >
      <div className="glass rounded-xl p-4 shadow-2xl glow-purple border border-purple-500/30 relative overflow-hidden">
        {/* Background gradient animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20"
          animate={{
            backgroundPosition: ['0%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 100%',
          }}
        />

        {/* Content */}
        <div className="relative flex items-start gap-3">
          {/* Icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center glow-purple"
          >
            <Music className="w-5 h-5 text-white" />
          </motion.div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-1">
              {notification.message}
            </p>
            {notification.songRequest && (
              <p className="text-xs text-gray-400">
                {notification.songRequest.song.title} • {notification.songRequest.song.artist}
              </p>
            )}
          </div>

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}
