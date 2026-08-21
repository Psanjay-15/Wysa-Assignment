# AI Usage

## Overview

I used OpenAI Codex as a supporting engineering tool during this assignment. I mainly used it to organize requirements, discuss design alternatives, review parts of the implementation, identify edge cases, and help verify the finished behavior.

I began in Codex **Plan mode** instead of immediately asking it to write code. I first provided the complete problem and used the planning discussion to make sure Codex understood the requirements, the proposed approach, the responsibilities of each component, and the important edge cases. I moved to implementation only after reviewing and refining that plan.

The architecture and scope were not accepted directly from an AI response. I decided which features were required, selected the final technology choices, kept the code intentionally simple, reviewed the suggested changes, and corrected the design when it did not match my understanding of the assignment.

## 1. AI tool used

- **OpenAI Codex** — used for brainstorming, targeted code suggestions, code review, debugging, and verification support.

The assignment document was the source of truth. I compared suggestions with the functional requirements before including them in the project.

## 2. My approach

I approached the assignment in the following order:

1. I started in **Plan mode** and provided the complete problem statement before requesting any code.
2. I extracted the main behaviors, including module movement, option-based routing, active state, permanent history, checkpoints, stale links, and invalid flows.
3. I used the planning discussion to check Codex's understanding, clarify requirements, compare approaches, and define the overall solution.
4. I drafted the backend structure and identified the minimum models, controllers, middleware, routes, and utilities needed.
5. I chose JavaScript, Node.js, Express, MongoDB, and Mongoose and removed tools that were unnecessary for the scope of this submission.
6. I divided the reviewed plan into small features and checked each feature before moving to the next one.
7. I used Codex to discuss difficult state-management cases and compare possible implementations.
8. I inspected the resulting code, simplified unnecessary abstractions, and corrected behavior that did not match the assignment.
9. I verified the complete flow through API requests, stored MongoDB state, permanent history, and the React client.

Starting with a complete plan gave the implementation a clear direction and reduced the chance of solving only part of the problem. The later incremental process helped me understand why each component was needed instead of treating the project as one generated output.

## 3. Examples of prompts I used

These are a few examples from the discussion. They represent the main ways I used AI rather than listing every implementation request.

> Review these functional requirements and help me draft a simple Node.js, Express, and MongoDB architecture and plan for the process.

> Compare different ways to store active conversation state and permanent history. The solution must support module switching, returning to a visited module, checkpoints, and stale links without becoming unnecessarily complex.

> Review the answer-processing design for invalid question IDs, invalid options, option ownership, broken references, repeated requests, module transitions, and concurrent requests. Point out any case that could corrupt state or history.

> Audit the completed application against every assignment requirement. Verify same-module and cross-module flows, checkpoints, stale deep links, module returns, permanent history, and previous-question navigation. Report any mismatch instead of assuming it works.

## 4. Brainstorming and decisions

I considered several alternatives before choosing the final design:

| Area                | Alternatives considered                                         | My final decision                                                                                                      |
| ------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| User identification | Anonymous participant ID or authenticated user                  | I chose simple email/password authentication with JWT so conversations and history have clear ownership.               |
| Routing             | Client-selected destination or server-selected destination      | I kept routing on the server. The client sends only the current question and selected option.                          |
| State storage       | One mutable history document or separate state and history      | I separated active `Conversation` state from append-only `ConversationHistory`.                                        |
| Checkpoints         | Delete previous data or start a new active segment              | I reset only the active module context and preserve permanent history.                                                 |
| Stale links         | Reopen the requested question or return current state           | I return the latest valid question and mark the old request as stale without changing state.                           |
| Concurrent requests | Allow the latest write or reject an outdated request            | I used `stateVersion` so only one operation can update a particular state version.                                     |
| Back navigation     | Module-local path, history reconstruction, or conversation path | I used a conversation-wide navigation stack so back navigation can safely cross modules but cannot cross a checkpoint. |

## 5. What I changed from AI suggestions

I did not use all initial suggestions unchanged. Important modifications included:

- I replaced anonymous participant IDs with simple JWT authentication.
- I removed unnecessary helper functions and kept direct logic where an abstraction did not improve readability.
- I required stable IDs for every module, question, and option.
- I separated active state from permanent history and used a transaction so both remain consistent.
- I clarified that stale deep links must return the canonical current question rather than reactivate an old question.

## 6. What AI got wrong or needed correction

- The first architecture proposal contained more tooling and abstraction than the assignment needed. I reduced it to a stack I could understand and maintain clearly.
- Some early helper functions made simple controller responses harder to follow, so I removed them.
- Stale-link handling was initially open to interpretation. I corrected it after checking the exact requirement that the latest valid question should be returned.
- The first previous-question design handled only movement inside the current module. I reviewed the module-switching requirement and expanded the state design to support safe cross-module rewind.

## 7. How I verified correctness

I did not rely only on AI review. I checked the implementation through the running application and the stored database state.

- Verified registration, login, JWT protection, and conversation ownership.
- Started conversations from multiple modules.
- Tested movement within the same module and transitions into other modules.
- Switched modules multiple times and returned to previously visited modules.
- Submitted invalid and stale question IDs and invalid option IDs.
- Confirmed that an option must belong to the current question.
- Confirmed that invalid requests do not change active state or add accepted history.
- Verified checkpoint resets while ensuring earlier permanent history remained available.
- Tested same-module and cross-module previous-question navigation.
- Inspected the final active module, state version, active answers, navigation path, and permanent history in MongoDB.

## 8. My contribution

AI helped me work more systematically, but I remained responsible for the submission. I interpreted the requirements, decided the scope, chose the architecture, evaluated trade-offs, reviewed and simplified the implementation, identified incorrect assumptions, requested corrections, tested the edge cases, and documented the final system.

Using AI in this way supported my reasoning and development process without replacing my responsibility for understanding the solution.
