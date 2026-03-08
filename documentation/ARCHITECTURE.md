# Project Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                                                                   │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │   HTTP Client   │              │  WebSocket      │           │
│  │  (REST API)     │              │  Client         │           │
│  └────────┬────────┘              └────────┬────────┘           │
└───────────┼──────────────────────────────┼─────────────────────┘
            │                               │
            │ JWT Token                     │ Real-time Events
            │                               │
┌───────────▼───────────────────────────────▼─────────────────────┐
│                     EXPRESS + SOCKET.IO SERVER                   │
│                          (server.js)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     MIDDLEWARE LAYER                        │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ Auth         │  │ Validation   │  │ Socket          │  │ │
│  │  │ Middleware   │  │ Middleware   │  │ Middleware      │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      ROUTES LAYER                           │ │
│  │                                                              │ │
│  │  ┌──────────────────┐         ┌──────────────────┐         │ │
│  │  │  Auth Routes     │         │ Document Routes  │         │ │
│  │  │  /api/auth/*     │         │ /api/documents/* │         │ │
│  │  │                  │         │                  │         │ │
│  │  │ • /register      │         │ • GET /          │         │ │
│  │  │ • /login         │         │ • POST /         │         │ │
│  │  │ • /logout        │         │ • GET /:id       │         │ │
│  │  └──────────────────┘         │ • PUT /:id       │         │ │
│  │                               │ • DELETE /:id    │         │ │
│  │                               └──────────────────┘         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    SOCKET.IO EVENTS                         │ │
│  │                                                              │ │
│  │  • connection        → User connects                        │ │
│  │  • join-document     → Join document room                   │ │
│  │  • document-change   → Broadcast edits                      │ │
│  │  • disconnect        → User disconnects                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     BUSINESS LOGIC                          │ │
│  │                                                              │ │
│  │  ┌──────────────┐              ┌──────────────┐            │ │
│  │  │  Auth Utils  │              │  DB Utils    │            │ │
│  │  │              │              │              │            │ │
│  │  │ • JWT Sign   │              │ • Connect    │            │ │
│  │  │ • JWT Verify │              │ • Query      │            │ │
│  │  │ • Hash Pass  │              │ • Transform  │            │ │
│  │  └──────────────┘              └──────────────┘            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MODELS (Mongoose)                        │ │
│  │                                                              │ │
│  │  ┌──────────────┐              ┌──────────────┐            │ │
│  │  │ User Model   │              │ Document     │            │ │
│  │  │              │              │ Model        │            │ │
│  │  │ • username   │              │ • title      │            │ │
│  │  │ • email      │              │ • content    │            │ │
│  │  │ • password   │              │ • owner      │            │ │
│  │  │ • createdAt  │              │ • createdAt  │            │ │
│  │  └──────────────┘              └──────────────┘            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │
                    ┌───────────▼──────────┐
                    │   MongoDB Database   │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │  users         │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │  documents     │  │
                    │  └────────────────┘  │
                    └──────────────────────┘
```

## **Data Flow Example**

### User Login Flow:
```
1. Client → POST /api/auth/login
2. Validation Middleware → Validates request
3. Auth Routes → Processes login
4. User Model → Queries MongoDB
5. Auth Utils → Generates JWT
6. Response ← JWT token sent to client
```

### Real-time Collaboration Flow:
```
1. User A edits document
2. WebSocket Client → Emits 'document-change' event
3. Socket Middleware → Authenticates connection
4. Server → Broadcasts to all users in room
5. Document Model → Updates MongoDB
6. User B, C, D ← Receive real-time update
```

