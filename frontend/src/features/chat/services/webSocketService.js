class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Set();
    this.connectionHandlers = new Set();
  }

  connect(url = 'ws://localhost:3001/ws') {
    try {
      this.ws = new WebSocket(url);
      this.setupEventListeners();
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.handleReconnect();
    }
  }

  setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyMessageHandlers(data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.isConnected = false;
      this.notifyConnectionHandlers('disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      this.notifyConnectionHandlers('error', error);
    };
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      console.error('[WebSocket] Cannot send message - not connected');
      return false;
    }
  }

  addMessageHandler(handler) {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler) {
    this.messageHandlers.delete(handler);
  }

  addConnectionHandler(handler) {
    this.connectionHandlers.add(handler);
  }

  removeConnectionHandler(handler) {
    this.connectionHandlers.delete(handler);
  }

  notifyMessageHandlers(data) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('[WebSocket] Error in message handler:', error);
      }
    });
  }

  notifyConnectionHandlers(status, data = null) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(status, data);
      } catch (error) {
        console.error('[WebSocket] Error in connection handler:', error);
      }
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getReadyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
