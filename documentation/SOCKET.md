# WebSocket Events - Detailed Explanation

Based on my project structure, here are the typical WebSocket events for my collaborative document editor:

## **Core Socket.IO Events**

### 1. **`connection`** (Built-in Socket.IO Event)
```javascript
// When a client connects to the WebSocket server
socket.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Socket middleware authenticates the user via JWT
    // User object is attached to socket.user
});
```
**Purpose**: Establishes WebSocket connection between client and server
- Triggered automatically when client connects
- Authentication happens via socket middleware
- Assigns unique `socket.id` to each connection

---

### 2. **`join-document`** (Custom Event)
```javascript
socket.on('join-document', async (documentId) => {
    // User joins a specific document room
    socket.join(documentId);
    
    // Load document from database
    const document = await Document.findById(documentId);
    
    // Send current document content to the user
    socket.emit('load-document', document);
    
    // Notify others that user joined
    socket.to(documentId).emit('user-joined', {
        userId: socket.user._id,
        username: socket.user.username
    });
});
```
**Purpose**: User joins a collaborative document session
- **Client sends**: `documentId` they want to edit
- **Server does**:
  - Adds user to Socket.IO "room" (namespace for that document)
  - Fetches current document from MongoDB
  - Sends document content back to user
  - Notifies other users in room about new participant

---

### 3. **`load-document`** (Server → Client)
```javascript
// Server emits to specific user
socket.emit('load-document', {
    _id: document._id,
    title: document.title,
    content: document.content,
    owner: document.owner,
    collaborators: document.collaborators
});
```
**Purpose**: Sends initial document data to newly joined user
- Only sent to the requesting user (not broadcast)
- Contains full document state
- Client uses this to initialize their editor

---

### 4. **`document-change`** (Bidirectional)
```javascript
// Client sends changes
socket.emit('document-change', {
    documentId: '123abc',
    delta: {
        ops: [{ retain: 5 }, { insert: 'Hello' }]
    },
    cursorPosition: 10
});

// Server receives and broadcasts
socket.on('document-change', async (data) => {
    const { documentId, delta } = data;
    
    // Update document in database
    await Document.findByIdAndUpdate(documentId, {
        content: applyDelta(document.content, delta),
        updatedAt: Date.now()
    });
    
    // Broadcast to all OTHER users in the room
    socket.to(documentId).emit('document-change', {
        delta: delta,
        userId: socket.user._id,
        username: socket.user.username
    });
});
```
**Purpose**: Real-time synchronization of document edits
- **Client → Server**: Sends text changes (insertions, deletions)
- **Server → Other Clients**: Broadcasts changes to all collaborators
- Uses **Operational Transformation** or **CRDT** algorithms for conflict resolution
- Delta format tracks precise changes (not entire document)

---

### 5. **`cursor-activity`** (Optional Feature)
```javascript
socket.on('cursor-activity', (data) => {
    const { documentId, position, selection } = data;
    
    // Broadcast cursor position to others
    socket.to(documentId).emit('cursor-activity', {
        userId: socket.user._id,
        username: socket.user.username,
        position: position,
        selection: selection,
        color: getUserColor(socket.user._id) // Assign color per user
    });
});
```
**Purpose**: Show where other users are typing
- Displays colored cursors for each collaborator
- Shows text selection ranges
- Enhances collaborative awareness

---

### 6. **`typing-indicator`** (Optional Feature)
```javascript
socket.on('typing-start', (documentId) => {
    socket.to(documentId).emit('user-typing', {
        userId: socket.user._id,
        username: socket.user.username
    });
});

socket.on('typing-stop', (documentId) => {
    socket.to(documentId).emit('user-stopped-typing', {
        userId: socket.user._id
    });
});
```
**Purpose**: Show "User is typing..." indicator
- Improves UX by showing active users
- Typically debounced (stops after 2-3 seconds of inactivity)

---

### 7. **`leave-document`** (Custom Event)
```javascript
socket.on('leave-document', (documentId) => {
    socket.leave(documentId);
    
    // Notify others
    socket.to(documentId).emit('user-left', {
        userId: socket.user._id,
        username: socket.user.username
    });
});
```
**Purpose**: User explicitly leaves document session
- Removes user from room
- Notifies remaining collaborators
- Cleans up resources

---

### 8. **`disconnect`** (Built-in Socket.IO Event)
```javascript
socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, reason);
    
    // Clean up: notify all rooms this user was in
    const rooms = Array.from(socket.rooms);
    rooms.forEach(documentId => {
        socket.to(documentId).emit('user-left', {
            userId: socket.user._id,
            username: socket.user.username
        });
    });
});
```
**Purpose**: Handles unexpected disconnections
- **Reasons**: Network issues, browser closed, timeout
- Automatically cleans up user from all rooms
- Notifies other users about disconnection

---

### 9. **`save-document`** (Optional - Manual Save)
```javascript
socket.on('save-document', async ({ documentId, content }) => {
    await Document.findByIdAndUpdate(documentId, {
        content: content,
        updatedAt: Date.now()
    });
    
    socket.emit('document-saved', {
        success: true,
        timestamp: Date.now()
    });
});
```
**Purpose**: Explicit save trigger
- Some apps auto-save on every change
- Others have manual "Save" button
- Provides user feedback on save status

---

### 10. **`error`** (Error Handling)
```javascript
socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('error-message', {
        message: 'An error occurred',
        code: error.code
    });
});
```
**Purpose**: Handle WebSocket errors gracefully
- Authentication failures
- Permission errors
- Network issues

---

## **Event Flow Diagram**

```
CLIENT A                    SERVER                     CLIENT B
   │                           │                           │
   │─── connect ──────────────>│                           │
   │<── authenticated ─────────│                           │
   │                           │                           │
   │─── join-document ────────>│                           │
   │<── load-document ─────────│                           │
   │                           │<─── join-document ────────│
   │<─────────────── user-joined ─────────────────────────>│
   │                           │                           │
   │─── document-change ──────>│                           │
   │                           │─── save to DB             │
   │                           │─── document-change ──────>│
   │                           │                           │
   │<───────────────────── cursor-activity ────────────────│
   │                           │                           │
   │─── disconnect ───────────>│                           │
   │                           │─── user-left ────────────>│
```

---

## **Key Concepts**

### **Rooms (Namespaces)**
- Each document has its own "room"
- `socket.join(documentId)` adds user to room
- `socket.to(documentId).emit()` broadcasts to room members only

### **Broadcasting Patterns**
- `socket.emit()` → Send to single user
- `socket.broadcast.emit()` → Send to all except sender
- `socket.to(room).emit()` → Send to specific room
- `io.emit()` → Send to ALL connected clients

### **Authentication**
Your project uses **socket middleware** to verify JWT before allowing WebSocket connection, ensuring only authenticated users can collaborate.