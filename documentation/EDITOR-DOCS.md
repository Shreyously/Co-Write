**How Quill Handles Change:**

- **Quill** is a rich text editor that uses a **Delta** format to represent document changes.
- When a user types, deletes, or formats text, Quill generates a **delta object** describing only the change (not the whole document).
- Quill triggers the `text-change` event, passing:
  - The delta (what changed)
  - The old delta (previous state)
  - The source (user or API)
- Example:
  ```js
  quill.on('text-change', (delta, oldDelta, source) => {
    // delta: { ops: [{ insert: 'A' }] }
    // oldDelta: previous document state
    // source: 'user' or 'api'
  });
  ```
- In collaborative apps, the client sends this delta to the server (e.g., via `send-changes`).
- Other clients receive the delta and apply it using `quill.updateContents(delta)`, ensuring all editors stay in sync.
- This delta-based approach is efficient and enables real-time collaboration.


**How Delta Works in the Editor:**

- **Delta** is a data structure that represents changes (insert, delete, retain) made to a document, not the whole content.
- When a user types, deletes, or formats text, the editor (like Quill.js) generates a delta describing just that change.
- Example: Inserting "A" at position 0 is `{ ops: [{ insert: "A" }] }`.
- When a change happens, the client emits the delta to the server (`send-changes` event).
- The server broadcasts the delta to other users in the same document room (`receive-changes` event).
- Other clients receive the delta and apply it to their local editor, updating only the changed part.
- This approach is efficient and enables real-time collaborative editing, as only the changes are sent—not the entire document.