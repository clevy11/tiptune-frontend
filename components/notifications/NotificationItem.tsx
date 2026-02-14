'use client'

import { motion } from 'framer-motion'
import { Music, X, CheckCircle2 } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import type { Notification } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: Notification
  index: number
}

export function NotificationItem({ notification, index }: NotificationItemProps) {
  const { markAsRead, removeNotification } = useNotificationStore()
  const isRead = notification.isRead

  const handleClick = () => {
    if (!isRead) {
      markAsRead(notification.id)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeNotification(notification.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.9 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={handleClick}
      className={cn(
        'group relative glass rounded-xl p-4 cursor-pointer transition-all duration-300',
        'hover:bg-white/10 hover:scale-[1.02]',
        !isRead && 'border-l-4 border-l-purple-500 bg-purple-500/10',
        isRead && 'opacity-70'
      )}
    >
      {/* Glow effect for unread */}
      {!isRead && (
        <div className="absolute inset-0 rounded-xl glow-purple opacity-30 blur-sm" />
      )}

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <motion.div
          animate={!isRead ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            !isRead
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 glow-purple'
              : 'bg-gray-600/50'
          )}
        >
          <Music className="w-5 h-5 text-white" />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', !isRead ? 'text-white' : 'text-gray-400')}>
            {notification.message}
          </p>
          {notification.songRequest && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <span className="font-medium">{notification.songRequest.song.title}</span>
              <span>•</span>
              <span>{notification.songRequest.song.artist}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notification.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isRead && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                markAsRead(notification.id)
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Mark as read"
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRemove}
            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            aria-label="Remove notification"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </motion.button>
        </div>
      </div>

      {/* Sound wave animation for unread */}
      {!isRead && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 6, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  )
}
