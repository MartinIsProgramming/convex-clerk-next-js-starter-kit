---
description: Execute a task following project patterns. Use for implementing features, bug fixes, or enhancements.
---

# Task Execution

> **CRITICAL:** This command REQUIRES using the `mcp__sequential-thinking__sequentialthinking` tool to plan and divide work BEFORE any implementation. You MUST invoke the `backend-builder` and `frontend-builder` skills when the task involves their domains. They do NOT auto-invoke - YOU must call them explicitly using the Skill tool.

## 0. Sequential Thinking Planning (MANDATORY)

Before doing ANY implementation, you MUST use sequential thinking to:
1. Understand the full scope of the task
2. Divide work between backend and frontend
3. Determine the correct order of implementation
4. Plan which skills to invoke

### Sequential Thinking Structure for Task Planning

**Thought 1: Task Analysis**
- What is being asked?
- What is the expected end result?
- What user interactions are involved?

**Thought 2: Backend Requirements**
- Does this need schema changes? (new tables, fields, indexes)
- Does this need new queries/mutations/actions?
- Does this modify existing Convex functions?
- **If ANY of the above → MUST invoke `backend-builder` skill**

**Thought 3: Frontend Requirements**
- Does this need new pages or routes?
- Does this need new components?
- Does this modify existing UI?
- Does this need forms or data tables?
- **If ANY of the above → MUST invoke `frontend-builder` skill**

**Thought 4: Implementation Order**
- What must be done first? (usually backend before frontend)
- What are the dependencies between parts?
- Create ordered list of skill invocations

**Thought 5: File Inventory**
- List ALL files that will be created/modified
- Group by: convex/ (backend) vs src/ (frontend)

**Thought 6: Execution Plan**
- Step 1: Invoke `backend-builder` for [specific tasks]
- Step 2: Invoke `frontend-builder` for [specific tasks]
- Step 3: Verify with lint/knip

Set `totalThoughts: 6` minimum.

### Example Sequential Thinking

```json
{
  "thought": "The user wants to add a feature to cancel reservations with a reason. Let me analyze: this needs a new field in the schema (cancellationReason), a new mutation (cancel), and UI changes (cancel button + dialog with reason input). So I need BOTH backend-builder AND frontend-builder skills...",
  "thoughtNumber": 1,
  "totalThoughts": 6,
  "nextThoughtNeeded": true
}
```

---

## 1. Skill Invocation Rules (CRITICAL)

### When to Invoke `backend-builder`

INVOKE when the task involves ANY of:
- [ ] Schema changes (tables, fields, indexes)
- [ ] New queries, mutations, or actions
- [ ] Modifying existing Convex functions
- [ ] Auth or permission logic in backend
- [ ] Database operations

**How to invoke:**
```
Use the Skill tool with skill: "backend-builder"
```

### When to Invoke `frontend-builder`

INVOKE when the task involves ANY of:
- [ ] New pages or routes
- [ ] New React components
- [ ] Forms (ALWAYS needs frontend-builder)
- [ ] Data tables or lists
- [ ] UI modifications
- [ ] Client-side state management

**How to invoke:**
```
Use the Skill tool with skill: "frontend-builder"
```

### Common Patterns

| Task Type | Skills Needed |
|-----------|---------------|
| New CRUD feature | `backend-builder` → `frontend-builder` |
| Add field to existing entity | `backend-builder` → `frontend-builder` |
| New page with data | `backend-builder` (if new query) → `frontend-builder` |
| UI-only change | `frontend-builder` only |
| New API endpoint | `backend-builder` only |
| Bug fix in query | `backend-builder` only |
| Bug fix in component | `frontend-builder` only |
| Full feature (schema + UI) | `backend-builder` → `frontend-builder` |

---

## 2. Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. SEQUENTIAL THINKING (MANDATORY)                         │
│     - Analyze task                                          │
│     - Identify backend vs frontend work                     │
│     - Plan skill invocations                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. CREATE TODO LIST                                        │
│     - Add specific tasks for each skill                     │
│     - Mark dependencies                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. INVOKE BACKEND-BUILDER (if needed)                      │
│     - Schema changes first                                  │
│     - Then queries/mutations                                │
│     - Skill handles its own sequential thinking             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. INVOKE FRONTEND-BUILDER (if needed)                     │
│     - Pages and components                                  │
│     - Forms and data fetching                               │
│     - Skill handles its own sequential thinking             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. VERIFY                                                  │
│     - pnpm lint                                             │
│     - pnpm knip                                             │
│     - npx tsc --noEmit                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. MCP Tools to Use

| Tool | When |
|------|------|
| Sequential Thinking | ALWAYS first - to plan task division |
| Context7 | Unfamiliar library patterns |
| shadcn MCP | Before creating UI components |
| Convex MCP | Check schema, run queries for debugging |

---

## 4. Report Format

After completing the task:

```markdown
## Task Complete: [description]

### Planning
- Sequential thinking used: ✅
- Backend work identified: [yes/no]
- Frontend work identified: [yes/no]

### Skills Invoked
- [ ] backend-builder: [what was done]
- [ ] frontend-builder: [what was done]

### Files Changed
| File | Action | Description |
|------|--------|-------------|

### Verification
- pnpm lint: ✅
- pnpm knip: ✅
- npx tsc --noEmit: ✅

### How to Test
1. [verification steps]
```

---

## ⚠️ Common Mistakes to Avoid

1. **Skipping sequential thinking** → Leads to missed requirements
2. **Not invoking skills** → Skills do NOT auto-invoke, you MUST call them
3. **Wrong order** → Always backend before frontend when both are needed
4. **Implementing directly** → Always delegate to the appropriate skill
5. **Forgetting frontend for backend changes** → If you add a field, UI probably needs updating too

---

Task: $ARGUMENTS
