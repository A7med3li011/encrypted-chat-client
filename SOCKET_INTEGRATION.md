# Socket.io Integration

This document describes the Socket.io real-time messaging integration in the encrypted chat client.

## Overview

The application uses Socket.io for real-time bidirectional communication with the server. This enables:

- Instant message delivery
- Real-time typing indicators
- User presence status updates
- Message status updates (delivered/read)
- Live connection status

## Architecture

### Components

1. **SocketService** (`lib/socket/socket.service.ts`)

   - Core Socket.io client wrapper
   - Manages connection lifecycle
   - Event emission and listening
   - Singleton instance for app-wide use

2. **useSocket Hook** (`lib/hooks/useSocket.ts`)

   - React hook for accessing socket functionality
   - Auto-connects when user is authenticated
   - Provides connection status and socket methods

3. **ChatInterface** (`components/chat/ChatInterface.tsx`)
   - Main chat UI component
   - Integrates socket events for real-time updates
   - Handles typing indicators and presence

## Configuration

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SOCKET_URL=https://api.healthy.bond
```

The socket service will connect to this URL when a user is authenticated.

## Socket Events

### Emitted Events (Client → Server)

| Event            | Payload                                    | Description                            |
| ---------------- | ------------------------------------------ | -------------------------------------- |
| `message:send`   | `{ conversationId, content, messageType }` | Send a new message                     |
| `message:status` | `{ messageId, status }`                    | Update message status (delivered/read) |
| `typing:start`   | `conversationId`                           | User started typing                    |
| `typing:stop`    | `conversationId`                           | User stopped typing                    |
| `status:update`  | `'online' \| 'away' \| 'busy'`             | Update user presence status            |
| `heartbeat`      | -                                          | Keep connection alive                  |

### Listened Events (Server → Client)

| Event                | Payload                             | Description                                      |
| -------------------- | ----------------------------------- | ------------------------------------------------ |
| `connect`            | -                                   | Socket connected successfully                    |
| `connection:success` | `{ accountId }`                     | Authentication successful                        |
| `connect_error`      | `error`                             | Connection error                                 |
| `disconnect`         | `reason`                            | Socket disconnected                              |
| `message:new`        | `Message`                           | New message received (alternative event)         |
| `message:received`   | `Message`                           | New message received (primary event from server) |
| `message:status`     | `{ messageId, status }`             | Message status updated                           |
| `message:deleted`    | `{ messageId }`                     | Message was deleted                              |
| `presence:update`    | `{ accountId, status }`             | User presence changed                            |
| `typing:update`      | `{ accountId, userName, isTyping }` | Typing indicator update                          |
| `heartbeat:ack`      | -                                   | Heartbeat acknowledgment                         |

## Features

### 1. Real-time Messaging

Messages are sent via Socket.io when connected, with automatic fallback to HTTP:

```typescript
if (socket.isConnected) {
  socket.sendMessage({ conversationId, content, messageType }, (response) => {
    // Handle response
  });
} else {
  // Fallback to HTTP API
  await sendViaHttp(conversationId, content);
}
```

### 2. Typing Indicators

Automatically shows when other users are typing:

- Starts when user types (debounced)
- Stops after 3 seconds of inactivity
- Stops when message is sent
- Only works when socket is connected

### 3. User Presence

Shows online/away/busy status with color-coded indicators:

- 🟢 Green: Online
- 🟡 Yellow: Away
- 🔴 Red: Busy
- ⚫ Gray: Offline

### 4. Message Status Updates

Real-time delivery and read receipts:

- Message sent → delivered → read
- Updates reflected immediately in the UI

### 5. Connection Status

Visual indicators show connection state:

- **Connected**: Green dot, "Live" badge
- **Connecting**: Yellow pulsing dot
- **Disconnected**: Red dot, reconnect button

## Usage in Components

### Basic Usage

```typescript
import { useSocket } from "@/lib/hooks/useSocket";

function ChatComponent() {
  const socket = useSocket();

  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (message) => {};

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket]);

  const sendMessage = () => {
    socket.sendMessage({
      conversationId: "abc123",
      content: "Hello!",
      messageType: "text",
    });
  };

  return (
    <div>
      <p>Status: {socket.connectionStatus}</p>
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

### Typing Indicators

```typescript
const handleInputChange = (e) => {
  const value = e.target.value;

  if (value.trim() && socket.isConnected) {
    socket.startTyping(conversationId);

    // Auto-stop after 3 seconds
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.stopTyping(conversationId);
    }, 3000);
  } else {
    socket.stopTyping(conversationId);
  }
};
```

## Connection Lifecycle

1. **User authenticates** → Token stored in localStorage
2. **useSocket hook initializes** → Auto-connects if authenticated
3. **Connection established** → `connect` event fired
4. **Authentication verified** → `connection:success` event fired
5. **User can send/receive messages** → Real-time updates
6. **User logs out** → Socket disconnects

## Error Handling

- **Connection errors**: Automatically attempts reconnection (up to 3 times)
- **Send failures**: Falls back to HTTP API
- **Not connected**: Typing/presence updates silently fail (non-critical)

## Testing

Use the provided HTML test client (`socket-test-client.html`) to test socket functionality:

1. Open the HTML file in a browser
2. Paste your access token
3. Click "Connect"
4. Test various features (send message, typing, presence, etc.)

## Troubleshooting

### Socket not connecting

1. Check `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
2. Verify authentication token exists in localStorage
3. Check browser console for connection errors
4. Ensure server is running and accessible

### Messages not appearing

1. Verify socket is connected (check "Live" indicator)
2. Check that conversation ID matches
3. Look for errors in browser console
4. Try refreshing the page

### Typing indicators not working

1. Ensure socket is connected
2. Check that both users are in the same conversation
3. Verify typing events are being emitted (check network tab)

## Performance Considerations

- Socket instance is a singleton (shared across app)
- Event listeners are properly cleaned up on unmount
- Typing events are debounced (3-second timeout)
- Non-critical operations (typing/presence) fail silently when disconnected

## Security

- Authentication via JWT token in socket handshake
- Token stored in localStorage
- Automatic disconnection on auth failure
- HTTPS/WSS in production (configure `NEXT_PUBLIC_SOCKET_URL` accordingly)
