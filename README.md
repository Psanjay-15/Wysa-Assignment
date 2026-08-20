# Wysa Conversation Flow

A backend service for deterministic, question-based conversation flows. Users answer questions, move within or between modules, pass checkpoints that reset active context, and safely recover from stale question links while permanent history remains intact.

The backend is the assignment deliverable. A React client is also included as an optional interface for exercising the complete flow without manually calling the API.

## Live demo

Website: [https://wysa-drab.vercel.app](https://wysa-drab.vercel.app)

Use this dummy account to test the complete conversation flow:

```text
Email: s@gmail.com
Password: 0987654321
```

This account is provided only for assignment demonstration and testing.

## Assignment requirements

| Requirement                       | Implementation                                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start a module                    | An authenticated user can start any configured module at its validated starting question.                                                                        |
| Option-based routing              | Every option has a server-owned destination. The client cannot choose the next question.                                                                         |
| Module switching                  | Answers can move within the current module or transition to another module.                                                                                      |
| Active state and complete history | `Conversation` stores the current valid state; `ConversationHistory` stores an append-only event timeline.                                                       |
| Checkpoints                       | After a checkpoint answer is accepted, only that module's active context is reset and a new segment begins. Permanent history is preserved.                      |
| Stale deep links                  | Old, inactive, and invalid question links return the canonical current question with `stale: true`.                                                              |
| Defensive flow handling           | Invalid options, stale questions, broken references, repeated answers, concurrent answers, multiple switches, and returns to visited modules are handled safely. |
| Previous-question navigation      | Users can move back through the active conversation path, including across module transitions, while keeping permanent history.                                 |

The optional “go back” bonus is implemented and extended to support safe cross-module rewind as a protected, state-versioned conversation transition.

## Technology

### Backend

- Node.js and JavaScript ES modules
- Express
- MongoDB and Mongoose
- JSON Web Tokens for authentication
- bcrypt for password hashing
- MongoDB transactions for atomic state and history updates

### Optional client

- React and Vite
- JavaScript
- styled-components
- Axios
- React Router

## Architecture

```text
React client or API consumer
            |
            v
       Express routes
            |
            v
      JWT middleware
            |
            v
   Auth / conversation controllers
            |
            +----------------------+----------------------+
            |                      |                      |
            v                      v                      v
          Flow                Conversation       ConversationHistory
   routing definition          active state        permanent events
            |                      |                      |
            +----------------------+----------------------+
                                   |
                                   v
                      MongoDB replica set / Atlas
```

## Data model

### `User`

Stores only the fields required for authentication:

- `email`
- hashed `password`
- timestamps

### `Flow`

Stores a versioned conversation definition. Modules, questions, and options are embedded because they are read together as one routing graph.

Important fields:

- `flowId` and `version`
- modules with stable `moduleId` values
- each module's `startQuestionId`
- questions with stable `questionId` values
- options with stable `optionId` values
- each option's server-only next destination or explicit completion marker

Example destination:

```json
{
  "type": "question",
  "moduleId": "stress-support",
  "questionId": "stress-level"
}
```

Explicit completion:

```json
{
  "type": "complete"
}
```

Flow validation rejects duplicate IDs, empty modules, questions without options, invalid starting questions, and missing target modules or questions. Validation runs when a flow is saved and again before the API starts listening.

### `Conversation`

Stores the user's active, mutable state:

- authenticated `userId`
- flow ID, version, and MongoDB reference
- conversation status
- current module and question
- `stateVersion` for safe updates
- one state entry per visited module
- module status: `active`, `suspended`, or `completed`
- module segment number
- active answers since the latest checkpoint
- active question path
- conversation-wide navigation stack for same-module and cross-module back navigation

Only one module state can be active at a time. Returning to a visited module reuses its existing state instead of creating a duplicate.

### `ConversationHistory`

Stores the permanent, append-only timeline separately from active state.

Event types:

- `CONVERSATION_STARTED`
- `ANSWER_ACCEPTED`
- `MODULE_TRANSITIONED`
- `CHECKPOINT_RESET`
- `CONVERSATION_COMPLETED`
- `BACK_NAVIGATED`

Events include a state version, event order, relevant module/question/option IDs, segment number, and timestamp. Resetting active context never deletes these events.

## State transition behavior

For every answer, the backend:

1. Confirms the conversation belongs to the authenticated user.
2. Confirms the conversation is still active.
3. Confirms `questionId` is the current expected question.
4. Confirms `expectedStateVersion` matches the saved version.
5. Confirms `optionId` belongs to that exact question.
6. Resolves the next destination from the stored flow definition.
7. Updates active state and permanent history in one MongoDB transaction.
8. Returns the next public question or an explicit completion response.

The public option response contains only `optionId` and `text`; it never exposes the configured next destination.

### Module return policy

When a transition returns to a previously visited module, the existing module state is reused. The option's explicit destination becomes the new current question, while existing context from the current segment remains available. No duplicate module state or duplicate answers are created.

### Checkpoint policy

The reset happens **after the checkpoint answer is accepted**. That answer is permanently recorded under the old segment, then the module's active answers and path are cleared, its segment number increases, and routing continues from the configured destination.

### Back-navigation policy

Back navigation uses a conversation-wide stack of visited module/question positions. It can cross a module transition by suspending the current module and reactivating the previous module. It cannot cross an accepted checkpoint or run after conversation completion. Moving back removes the answer that caused the forward transition only from active context so the previous question can be answered again. The original answer remains in permanent history, and a `BACK_NAVIGATED` event records both the source and destination modules. Every back action increments `stateVersion`, so repeated and concurrent requests are handled safely.

### Duplicate and concurrent requests

Every accepted answer increases `stateVersion` by one. A repeated, stale, or concurrent request using an old version returns `409` and cannot advance the flow or add successful history twice. The same version check runs inside the transaction, so only one concurrent answer succeeds.

### Deep-link policy

Deep-link resolution is read-only. If the requested module and question exactly match the active state, the API returns `stale: false`. Otherwise it returns the latest canonical question with `stale: true`; it never reactivates old state.

## Seeded sample flow

The sample `wellbeing-flow` contains four fictional modules:

- `daily-check-in`
- `stress-support`
- `sleep-support`
- `breathing-exercise`

It supports same-module movement, several cross-module paths, returning to Stress Support, a checkpoint reset, and explicit completion.

```text
Daily Check-in
  -> Stress Support
     -> Sleep Support
        -> Breathing Exercise
           -> Stress Support checkpoint
```

## API overview

Base URL: `http://localhost:8000/api`

| Method | Endpoint                                                                 | Authentication | Purpose                                                          |
| ------ | ------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------- |
| `GET`  | `/health`                                                                | No             | Check whether the API is running.                                |
| `POST` | `/auth/register`                                                         | No             | Create an account and return a JWT.                              |
| `POST` | `/auth/login`                                                            | No             | Authenticate and return a JWT.                                   |
| `GET`  | `/auth/me`                                                               | Yes            | Return the authenticated user.                                   |
| `POST` | `/conversations/start`                                                   | Yes            | Start a new conversation at a selected module.                   |
| `POST` | `/conversations/:conversationId/answers`                                 | Yes            | Validate an answer and perform the server-controlled transition. |
| `POST` | `/conversations/:conversationId/back`                                    | Yes            | Move to the previous active question, including across a module transition. |
| `GET`  | `/conversations/:conversationId/current`                                 | Yes            | Return the canonical current question.                           |
| `GET`  | `/conversations/:conversationId/modules/:moduleId/questions/:questionId` | Yes            | Resolve a current, old, or invalid question link.                |
| `GET`  | `/conversations/:conversationId/history`                                 | Yes            | Return the complete permanent history without pagination.        |

> The health endpoint is `GET /api/health`; it is registered directly by the Express application.

### Start request

```http
POST /api/conversations/start
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "flowId": "wellbeing-flow",
  "moduleId": "daily-check-in"
}
```

### Answer request

```http
POST /api/conversations/:conversationId/answers
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "questionId": "daily-feeling",
  "optionId": "daily-stressed",
  "expectedStateVersion": 1
}
```

### Back request

```http
POST /api/conversations/:conversationId/back
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "expectedStateVersion": 2
}
```

### Important response codes

| Status | Meaning                                                                                   |
| ------ | ----------------------------------------------------------------------------------------- |
| `200`  | Successful read, answer, transition, or completion.                                       |
| `201`  | User or conversation created.                                                             |
| `400`  | Missing or malformed request data.                                                        |
| `401`  | Missing, invalid, or expired JWT.                                                         |
| `404`  | Resource not found or conversation not owned by the authenticated user.                   |
| `409`  | Stale question/version, repeated request, concurrent conflict, completed conversation, checkpoint boundary, or no previous active question. |
| `422`  | The submitted option does not belong to the current question.                             |
| `500`  | A stored flow contains an invalid runtime reference; no partial update is committed.      |

## Setup

### Prerequisites

- A supported Node.js LTS release
- npm
- MongoDB Atlas or a local MongoDB replica set

MongoDB must support transactions. A standalone local MongoDB server will not work for conversation writes. MongoDB Atlas is the simplest option because Atlas clusters are already configured as replica sets.

### 1. Configure and seed the backend

From the repository root:

```bash
cd server
npm install
cp .env.example .env
```

Set the following values in `server/.env`:

```env
PORT=8000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

Never commit `server/.env` or real credentials.

Seed the sample flow:

```bash
npm run seed:flow
```

Start the backend:

```bash
npm run dev
```

The API should be available at `http://localhost:8000`.

Verify it in another terminal:

```bash
curl http://localhost:8000/api/health
```

### 2. Start the optional React client

Open another terminal from the repository root:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

`client/.env` should contain:

```env
VITE_API_URL=http://localhost:8000/api
```

Vite normally starts at `http://localhost:5173`. If it selects another port, update `CLIENT_URL` in `server/.env` to that exact origin and restart the backend.

### 3. Exercise the end-to-end flow

1. Register or sign in.
2. Select one of the four modules.
3. Answer questions and observe the current module, question, and state version.
4. Open **History** to inspect permanent events.
5. Open **Test deep link** and enter an old or invalid module/question pair.
6. Use **Previous question** after moving forward, including after an answer switches to another module.
7. Follow the sample path through multiple modules and the Stress Support checkpoint.

The module launcher starts a new conversation at the selected module. Within an active conversation, module changes are controlled only by configured answers.

## Commands

### Backend commands

Run from `server/`:

| Command             | Purpose                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`       | Start the API with automatic restart during development.                                  |
| `npm start`         | Start the API with Node.js.                                                               |
| `npm run seed:flow` | Create or update the seeded sample flow.                                                  |

### Client commands

Run from `client/`:

| Command           | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Start the Vite development server.              |
| `npm run build`   | Create the production bundle in `client/dist/`. |
| `npm run preview` | Preview the production bundle locally.          |

## Project structure

```text
.
├── README.md
├── AI_USAGE.md
├── server/
│   ├── app.js
│   ├── index.js
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── conversation-back.controller.js
│       │   ├── conversation.controller.js
│       │   └── conversation-read.controller.js
│       ├── db/index.js
│       ├── middlewares/verify-jwt.js
│       ├── models/
│       │   ├── user.model.js
│       │   ├── flow.model.js
│       │   ├── conversation.model.js
│       │   └── conversation-history.model.js
│       ├── routes/
│       ├── seeds/                    # Sample flow definition and seed script
│       └── utils/
└── client/
    ├── index.html
    └── src/
        ├── api/client.js
        ├── components/
        ├── context/AuthContext.jsx
        ├── pages/
        ├── styles/
        ├── utils/api-error.js
        ├── App.jsx
        └── main.jsx
```

## Assumptions and scope

- Authentication uses email and password instead of anonymous participant IDs.
- Starting a module creates a new conversation; it does not overwrite another active conversation.
- The backend owns all routing decisions.
- Checkpoint reset occurs after the checkpoint answer is accepted.
- An explicit transition destination takes precedence when returning to a visited module.
- Back navigation removes the reverted answer from active context but never deletes permanent history.
- Cross-module back navigation reactivates the previous module and suspends the module being left.
- Back navigation cannot cross an accepted checkpoint.
- History retrieval intentionally has no pagination for this assignment.
