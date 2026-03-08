**WebSocket Events in my Project – Explained in Points**

---

### 1. **connection**
- Triggered when a client connects to the server via WebSocket.
- Server authenticates the user (usually with JWT).
- Sets up event listeners for further communication.

---

### 2. **join-document**
- Client emits this event with a document ID to join a collaborative editing session.
- Server adds the user to a Socket.IO room for that document.
- Server fetches the latest document content from the database.
- Server emits `load-document` event to the joining client with the document data.
- Server notifies other users in the room that a new user has joined (via `user-joined`).

---

### 3. **load-document**
- Sent by the server to the client after joining a document.
- Contains the current content and metadata of the document.
- Client uses this data to initialize the editor.

---

### 4. **document-change**
- Client emits this event when making changes (typing, deleting, etc.).
- Contains the change (delta) and document ID.
- Server updates the document in the database.
- Server broadcasts the change to all other users in the same room.
- Ensures all users see real-time updates.

---

### 5. **cursor-activity** (optional)
- Client emits this event when moving the cursor or selecting text.
- Server broadcasts the cursor position and selection to other users in the room.
- Allows users to see each other's cursors and selections.

---

### 6. **typing-indicator** (optional)
- Client emits `typing-start` and `typing-stop` events.
- Server broadcasts to others when a user starts or stops typing.
- Used to show "User is typing..." indicators.

---

### 7. **leave-document**
- Client emits this event when leaving a document.
- Server removes the user from the document room.
- Server notifies other users that the user has left.

---

### 8. **disconnect**
- Triggered automatically when a client disconnects (e.g., closes browser).
- Server removes the user from all rooms.
- Server notifies other users in those rooms that the user has left.

---

### 9. **error**
- Emitted when there is an error (e.g., authentication failure, invalid data).
- Server can send error messages to the client for handling.

---

**How It Works:**
- Users connect and authenticate via WebSocket.
- They join document rooms to collaborate.
- All edits, cursor moves, and typing status are sent as events.
- Server manages rooms, updates the database, and broadcasts changes.
- All users see real-time updates and presence of collaborators.