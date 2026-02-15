import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { SongRequest, Notification } from './types'

const WS_URL_DEFAULT = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws'

/** True if hostname looks like a local/dev IP (same-network mobile testing). Must match api.ts logic. */
function isLocalNetworkHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    const parts = hostname.split('.').map(Number)
    if (parts[0] === 192 && parts[1] === 168) return true
    if (parts[0] === 10) return true
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  }
  return false
}

/**
 * In production use NEXT_PUBLIC_WS_URL (e.g. wss:// or https://). 
 * Only use same-host:8080/ws when on a local network IP (e.g. phone at http://192.168.1.x:3000).
 */
function getEffectiveWsUrl(): string {
  if (typeof window === 'undefined') return WS_URL_DEFAULT
  if (isLocalNetworkHostname(window.location.hostname)) {
    return `http://${window.location.hostname}:8080/ws`
  }
  return WS_URL_DEFAULT
}

export interface EventRevenuePayload {
  eventId: number
  totalTipRevenue: number
}

class WebSocketService {
  private client: Client | null = null
  private subscribers: Map<string, Set<(data: SongRequest) => void>> = new Map()
  private revenueSubscribers: Map<string, Set<(data: EventRevenuePayload) => void>> = new Map()
  private notificationSubscribers: Map<string, Set<(data: Notification) => void>> = new Map()
  private subscriptions: Map<string, any> = new Map()

  connect() {
    if (this.client?.connected || this.client?.active) {
      return
    }

    // Clean up existing client if any
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(getEffectiveWsUrl()) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected')
        // Small delay to ensure connection is fully established
        setTimeout(() => {
          this.subscribeToTopics()
        }, 100)
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected')
      },
      onStompError: (frame) => {
        console.error('WebSocket STOMP error:', frame)
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event)
      },
    })

    this.client.activate()
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe())
      this.subscriptions.clear()
      this.client.deactivate()
      this.client = null
      this.subscribers.clear()
      this.revenueSubscribers.clear()
    }
  }

  private subscribeToTopics() {
    this.subscribers.forEach((callbacks, topic) => {
      this.subscribe(topic, callbacks)
    })
    this.revenueSubscribers.forEach((callbacks, topic) => {
      this.subscribeRevenue(topic, callbacks)
    })
    this.notificationSubscribers.forEach((callbacks, topic) => {
      this.subscribeNotification(topic, callbacks)
    })
  }

  subscribeToEventRevenue(
    eventId: number,
    callback: (data: EventRevenuePayload) => void
  ) {
    const topic = `/topic/event/${eventId}/revenue`
    if (!this.revenueSubscribers.has(topic)) {
      this.revenueSubscribers.set(topic, new Set())
    }
    this.revenueSubscribers.get(topic)!.add(callback)
    if (this.client?.connected || this.client?.active) {
      this.subscribeRevenue(topic, this.revenueSubscribers.get(topic)!)
    }
  }

  unsubscribeFromEventRevenue(eventId: number, callback: (data: EventRevenuePayload) => void) {
    const topic = `/topic/event/${eventId}/revenue`
    const callbacks = this.revenueSubscribers.get(topic)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        const sub = this.subscriptions.get(topic)
        if (sub) {
          sub.unsubscribe()
          this.subscriptions.delete(topic)
        }
        this.revenueSubscribers.delete(topic)
      }
    }
  }

  private subscribeRevenue(topic: string, callbacks: Set<(data: EventRevenuePayload) => void>) {
    if (!this.client?.connected && !this.client?.active) return
    if (this.subscriptions.has(topic)) return
    try {
      const subscription = this.client.subscribe(topic, (message: IMessage) => {
        try {
          const data: EventRevenuePayload = JSON.parse(message.body)
          callbacks.forEach((cb) => cb(data))
        } catch (e) {
          console.error('Error parsing revenue message:', e)
        }
      })
      this.subscriptions.set(topic, subscription)
    } catch (e) {
      console.error(`Error subscribing to ${topic}:`, e)
    }
  }

  subscribeToEventRequests(
    eventId: number,
    callback: (request: SongRequest) => void
  ) {
    const topic = `/topic/event/${eventId}/requests`
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set())
    }
    this.subscribers.get(topic)!.add(callback)

    if (this.client?.connected || this.client?.active) {
      this.subscribe(topic, this.subscribers.get(topic)!)
    }
  }

  subscribeToUserRequests(
    userId: number,
    callback: (request: SongRequest) => void
  ) {
    const topic = `/topic/user/${userId}/requests`
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set())
    }
    this.subscribers.get(topic)!.add(callback)

    if (this.client?.connected || this.client?.active) {
      this.subscribe(topic, this.subscribers.get(topic)!)
    }
  }

  private subscribe(topic: string, callbacks: Set<(data: SongRequest) => void>) {
    if (!this.client?.connected && !this.client?.active) {
      console.warn(`Cannot subscribe to ${topic}: WebSocket not connected`)
      return
    }

    if (this.subscriptions.has(topic)) {
      return // Already subscribed
    }

    try {
      const subscription = this.client.subscribe(topic, (message: IMessage) => {
        try {
          const data: SongRequest = JSON.parse(message.body)
          callbacks.forEach((callback) => callback(data))
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      })

      this.subscriptions.set(topic, subscription)
    } catch (error) {
      console.error(`Error subscribing to ${topic}:`, error)
    }
  }

  unsubscribeFromEventRequests(eventId: number, callback: (request: SongRequest) => void) {
    const topic = `/topic/event/${eventId}/requests`
    const callbacks = this.subscribers.get(topic)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        const subscription = this.subscriptions.get(topic)
        if (subscription) {
          subscription.unsubscribe()
          this.subscriptions.delete(topic)
        }
        this.subscribers.delete(topic)
      }
    }
  }

  unsubscribeFromUserRequests(userId: number, callback: (request: SongRequest) => void) {
    const topic = `/topic/user/${userId}/requests`
    const callbacks = this.subscribers.get(topic)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        const subscription = this.subscriptions.get(topic)
        if (subscription) {
          subscription.unsubscribe()
          this.subscriptions.delete(topic)
        }
        this.subscribers.delete(topic)
      }
    }
  }

  /**
   * Subscribe to DJ notifications
   */
  subscribeToDjNotifications(
    djId: number,
    callback: (notification: Notification) => void
  ) {
    const topic = `/topic/dj/${djId}`
    if (!this.notificationSubscribers.has(topic)) {
      this.notificationSubscribers.set(topic, new Set())
    }
    this.notificationSubscribers.get(topic)!.add(callback)

    if (this.client?.connected || this.client?.active) {
      this.subscribeNotification(topic, this.notificationSubscribers.get(topic)!)
    }
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToUserNotifications(
    userId: number,
    callback: (notification: Notification) => void
  ) {
    const topic = `/topic/user/${userId}`
    if (!this.notificationSubscribers.has(topic)) {
      this.notificationSubscribers.set(topic, new Set())
    }
    this.notificationSubscribers.get(topic)!.add(callback)

    if (this.client?.connected || this.client?.active) {
      this.subscribeNotification(topic, this.notificationSubscribers.get(topic)!)
    }
  }

  private subscribeNotification(
    topic: string,
    callbacks: Set<(data: Notification) => void>
  ) {
    if (!this.client?.connected && !this.client?.active) {
      console.warn(`Cannot subscribe to ${topic}: WebSocket not connected`)
      return
    }

    if (this.subscriptions.has(topic)) {
      return // Already subscribed
    }

    try {
      const subscription = this.client.subscribe(topic, (message: IMessage) => {
        try {
          const data: Notification = JSON.parse(message.body)
          callbacks.forEach((callback) => callback(data))
        } catch (error) {
          console.error('Error parsing notification message:', error)
        }
      })

      this.subscriptions.set(topic, subscription)
    } catch (error) {
      console.error(`Error subscribing to ${topic}:`, error)
    }
  }

  unsubscribeFromDjNotifications(
    djId: number,
    callback: (notification: Notification) => void
  ) {
    const topic = `/topic/dj/${djId}`
    const callbacks = this.notificationSubscribers.get(topic)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        const subscription = this.subscriptions.get(topic)
        if (subscription) {
          subscription.unsubscribe()
          this.subscriptions.delete(topic)
        }
        this.notificationSubscribers.delete(topic)
      }
    }
  }

  unsubscribeFromUserNotifications(
    userId: number,
    callback: (notification: Notification) => void
  ) {
    const topic = `/topic/user/${userId}`
    const callbacks = this.notificationSubscribers.get(topic)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        const subscription = this.subscriptions.get(topic)
        if (subscription) {
          subscription.unsubscribe()
          this.subscriptions.delete(topic)
        }
        this.notificationSubscribers.delete(topic)
      }
    }
  }
}

export const websocketService = new WebSocketService()
