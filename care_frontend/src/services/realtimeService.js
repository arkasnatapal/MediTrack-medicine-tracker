import { io } from 'socket.io-client';

class RealtimeService {
  constructor() {
    this.sockets = [];
    this.listeners = new Set();
    this.reconnectListeners = new Set();
    this.activeChannels = new Set();
    this.processedEvents = new Set();
    this.resourceVersions = new Map();
    this.maxProcessedEvents = 500;
  }

  getSocketUrls() {
    const urls = [];
    if (import.meta.env.VITE_CARE_REALTIME_URL) urls.push(import.meta.env.VITE_CARE_REALTIME_URL);
    if (import.meta.env.VITE_REALTIME_URL) urls.push(import.meta.env.VITE_REALTIME_URL);

    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      urls.push('http://localhost:5001');
      urls.push('http://localhost:5000');
    } else {
      if (import.meta.env.VITE_CARE_API_BASE_URL) {
        urls.push(import.meta.env.VITE_CARE_API_BASE_URL.replace(/\/api\/?$/, ''));
      }
      if (typeof window !== 'undefined') {
        urls.push(window.location.origin);
      }
    }

    return Array.from(new Set(urls.filter(Boolean)));
  }

  connect() {
    if (this.sockets.length > 0 && this.sockets.some(s => s.connected)) {
      return this.sockets;
    }

    const urls = this.getSocketUrls();
    const token = localStorage.getItem('care_token') || localStorage.getItem('token');

    urls.forEach((url) => {
      try {
        const s = io(url, {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
          transports: ['websocket', 'polling'],
          autoConnect: true,
        });

        s.on('connect', () => {
          console.log(`⚡ Care Realtime Socket connected to [${url}]:`, s.id);
          this.resubscribeActiveChannels();
          this.notifyReconnectListeners();
        });

        s.on('connect_error', (err) => {
          console.warn(`⚡ Care Realtime Socket connect_error on [${url}]:`, err.message);
        });

        s.on('domain_event', (eventPayload) => {
          this.handleIncomingEvent(eventPayload);
        });

        this.sockets.push(s);
      } catch (err) {
        console.warn(`Could not connect to socket url ${url}:`, err);
      }
    });

    return this.sockets;
  }

  handleIncomingEvent(eventPayload) {
    if (!eventPayload || !eventPayload.eventId) return;

    if (this.processedEvents.has(eventPayload.eventId)) {
      return;
    }

    this.processedEvents.add(eventPayload.eventId);
    if (this.processedEvents.size > this.maxProcessedEvents) {
      const oldestId = this.processedEvents.values().next().value;
      this.processedEvents.delete(oldestId);
    }

    if (eventPayload.resourceId && eventPayload.version) {
      const lastVer = this.resourceVersions.get(eventPayload.resourceId);
      if (lastVer && lastVer >= eventPayload.version) {
        return;
      }
      this.resourceVersions.set(eventPayload.resourceId, eventPayload.version);
    }

    console.log(`🔔 Dispatching Care Realtime Event [${eventPayload.type}]:`, eventPayload);

    this.listeners.forEach((listener) => {
      try {
        listener(eventPayload);
      } catch (err) {
        console.error('Error in care realtime event listener:', err);
      }
    });
  }

  subscribe(channels) {
    if (!Array.isArray(channels)) channels = [channels];

    channels.forEach((ch) => {
      if (ch) this.activeChannels.add(ch);
    });

    if (this.sockets.length === 0) {
      this.connect();
    } else {
      this.resubscribeActiveChannels();
    }
  }

  unsubscribe(channels) {
    if (!Array.isArray(channels)) channels = [channels];

    channels.forEach((ch) => {
      this.activeChannels.delete(ch);
    });

    this.sockets.forEach((s) => {
      if (s && s.connected) {
        s.emit('unsubscribe', { channels });
      }
    });
  }

  resubscribeActiveChannels() {
    if (this.activeChannels.size > 0) {
      const channelsList = Array.from(this.activeChannels);
      this.sockets.forEach((s) => {
        if (s && s.connected) {
          s.emit('subscribe', { channels: channelsList }, (res) => {
            if (res?.subscribed) {
              console.log('📡 Subscribed care channels acknowledged:', res.subscribed);
            }
          });
        }
      });
    }
  }

  addListener(listener) {
    this.listeners.add(listener);
    this.connect();
    return () => {
      this.listeners.delete(listener);
    };
  }

  addReconnectListener(listener) {
    this.reconnectListeners.add(listener);
    return () => {
      this.reconnectListeners.delete(listener);
    };
  }

  notifyReconnectListeners() {
    this.reconnectListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in reconnect refetch listener:', err);
      }
    });
  }

  disconnect() {
    this.sockets.forEach((s) => {
      if (s) s.disconnect();
    });
    this.sockets = [];
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
