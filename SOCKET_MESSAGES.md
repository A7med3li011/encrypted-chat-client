# Socket Real-Time Messages

This document explains how real-time messages work via Socket.io in the encrypted chat client.

## How It Works

### 1. **Receiving Messages**

When a new message is received from the socket server, the following flow occurs:

```
Socket Server → socket.on('message:new') → handleNewMessage() → addMessage() → UI Updates
```

#### Code Flow:

1. **Socket Event Listener** ([ChatInterface.tsx:33-44](components/chat/ChatInterface.tsx#L33-L44))

   ```typescript
   const handleNewMessage = (message: Message) => {
     if (message.conversationId === currentConversation?._id) {
       addMessage(message);
     }
   };

   socket.on("message:new", handleNewMessage);
   ```

2. **Add to Store** ([useChatStore.ts:28-42](lib/store/useChatStore.ts#L28-L42))

   ```typescript
   addMessage: (message) =>
     set((state) => {
       // Check if message already exists (prevent duplicates)
       const exists = state.messages.some(msg => msg._id === message._id);

       if (exists) {

         return state;
       }

       console.log('📝 Adding message to store:', message._id);
       return { messages: [...state.messages, message] };
     }),
   ```

3. **UI Auto-Updates** - React automatically re-renders when the messages array changes

### 2. **Sending Messages**

When you send a message, it follows this flow:

```
User Input → handleSendMessage() → socket.sendMessage() → Server → Server broadcasts message:new → handleNewMessage()
```

#### Code Flow:

1. **Send via Socket** ([ChatInterface.tsx:144-164](components/chat/ChatInterface.tsx#L144-L164))

   ```typescript
   if (socket.isConnected) {
     socket.sendMessage(
       {
         conversationId: currentConversation._id,
         content: tempMessage,
         messageType: "text",
       },
       (response) => {
         if (response.success) {
           console.log("✅ Message sent via socket successfully");
           // Message will be added via socket event listener (message:new)
         }
       }
     );
   }
   ```

2. **Server Receives** → **Server Validates** → **Server Saves to DB**

3. **Server Broadcasts** the `message:new` event to all participants

4. **Client Receives** the broadcast (including the sender) and adds it to messages

### 3. **Duplicate Prevention**

The `addMessage` function checks if a message with the same ID already exists before adding it. This prevents duplicates when:

- Message is sent via socket AND received via socket
- Message is sent via HTTP fallback AND later received via socket
- Server sends the same message multiple times

```typescript
const exists = state.messages.some((msg) => msg._id === message._id);
if (exists) return state; // Don't add duplicate
```

## Testing

### Option 1: Use Debug Panel

Add the [SocketDebugPanel](components/chat/SocketDebugPanel.tsx) to your ChatInterface:

```typescript
import { SocketDebugPanel } from "./SocketDebugPanel";

// In your component return:
<>
  <ChatInterface />
  <SocketDebugPanel />
</>;
```

### Option 2: Use Message Test Component

Add the [SocketMessageTest](components/chat/SocketMessageTest.tsx) component:

```typescript
import { SocketMessageTest } from "./SocketMessageTest";

// In your component return:
<>
  <ChatInterface />
  <SocketMessageTest />
</>;
```

This shows:

- Socket connection status
- Current conversation
- Message count
- Last 3 messages received
- Console log reminders

### Option 3: Monitor Console Logs

Open browser console (F12) and watch for these logs:

#### When receiving a message:

```
📨 NEW MESSAGE RECEIVED from socket: {message object}
  Current conversation: {conversationId}
  Message conversation: {conversationId}
✅ Message matches current conversation, adding to messages
📝 Adding message to store: {messageId}
  Current messages count: 5
  New messages count: 6
```

#### When sending a message:

```
📤 Sending message via socket...
✅ Message sent via socket successfully
  Response: {response object}
📨 NEW MESSAGE RECEIVED from socket: {message object}
📝 Adding message to store: {messageId}
```

## Common Issues

### Messages not appearing

**Check:**

1. ✅ Socket is connected (`socket.isConnected === true`)
2. ✅ You're in the correct conversation
3. ✅ Console shows `📨 NEW MESSAGE RECEIVED`
4. ✅ Console shows `📝 Adding message to store`
5. ✅ Message `conversationId` matches `currentConversation._id`

**If you see `📨 NEW MESSAGE RECEIVED` but not `📝 Adding message to store`:**

- The message's `conversationId` doesn't match your current conversation
- Check the console log: `⚠️ Message is for different conversation, ignoring`

**If you don't see `📨 NEW MESSAGE RECEIVED` at all:**

- Socket is not connected, check connection status
- Server is not broadcasting the `message:new` event
- Event listener is not registered (check component is mounted)

### Duplicate messages appearing

**This should not happen** because of duplicate prevention in `addMessage()`.

**If it happens:**

- Check console for `⚠️ Message already exists, skipping`
- If you don't see this warning, the messages have different IDs
- This could mean server is creating multiple messages with different IDs

### Messages appearing in wrong conversation

The socket listener filters messages by conversation:

```typescript
if (message.conversationId === currentConversation?._id) {
  addMessage(message);
}
```

**If messages appear in wrong conversation:**

- Server is sending incorrect `conversationId` in the message
- Check the console log to verify the conversation IDs

## Socket Events Reference

### Events You Listen To:

| Event             | Purpose                                 | Handler                              |
| ----------------- | --------------------------------------- | ------------------------------------ |
| `message:new`     | New message received                    | Adds message to current conversation |
| `message:status`  | Message status changed (delivered/read) | Updates existing message             |
| `message:deleted` | Message was deleted                     | Marks message as deleted             |
| `typing:update`   | User is typing                          | Shows/hides typing indicator         |
| `presence:update` | User status changed                     | Updates user presence indicator      |

### Events You Emit:

| Event            | Purpose               | Data                                       |
| ---------------- | --------------------- | ------------------------------------------ |
| `message:send`   | Send a new message    | `{ conversationId, content, messageType }` |
| `typing:start`   | User started typing   | `conversationId`                           |
| `typing:stop`    | User stopped typing   | `conversationId`                           |
| `message:status` | Update message status | `{ messageId, status }`                    |

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER A (You)                              │
│                                                               │
│  Type message → Send → Socket.emit('message:send')           │
│                           ↓                                   │
└───────────────────────────┼───────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │  SOCKET SERVER│
                    │               │
                    │  1. Receive   │
                    │  2. Validate  │
                    │  3. Save to DB│
                    │  4. Broadcast │
                    └───────┬───────┘
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
┌─────────────────────────┐   ┌─────────────────────────┐
│     USER A (You)        │   │     USER B (Other)      │
│                         │   │                         │
│ socket.on('message:new')│   │ socket.on('message:new')│
│         ↓               │   │         ↓               │
│  handleNewMessage()     │   │  handleNewMessage()     │
│         ↓               │   │         ↓               │
│    addMessage()         │   │    addMessage()         │
│         ↓               │   │         ↓               │
│   UI Updates ✨         │   │   UI Updates ✨         │
└─────────────────────────┘   └─────────────────────────┘
```

## Debug Checklist

When troubleshooting message delivery:

- [ ] Socket is connected (check debug panel or console)
- [ ] User is authenticated
- [ ] Token exists in cookies
- [ ] You're in a conversation
- [ ] Other user is also connected
- [ ] Console shows `📨 NEW MESSAGE RECEIVED`
- [ ] Console shows `📝 Adding message to store`
- [ ] Conversation IDs match
- [ ] No errors in console
- [ ] Server is running and accessible
- [ ] CORS is configured correctly on server

## Next Steps

1. **Test with two browser windows** - Open two different browsers or incognito windows
2. **Login as different users** in each window
3. **Open the same conversation** in both windows
4. **Send a message** from one window
5. **Verify it appears** in both windows in real-time
6. **Check console logs** to verify the flow

You should see the message appear instantly in both windows without refreshing!
