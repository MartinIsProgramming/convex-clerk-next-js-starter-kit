---
description: Review staged/unstaged changes before committing. Use to clean code before commit.
---

# Pre-Commit Code Review

> **CRITICAL:** This skill REQUIRES using the `mcp__sequential-thinking__sequentialthinking` tool for deep analysis. Do NOT skip this step.

## 0. Sequential Thinking Analysis (MANDATORY)

Before reviewing any code, you MUST use the sequential thinking MCP to deeply analyze the changes. This ensures thorough understanding rather than surface-level scanning.

### How to Use Sequential Thinking

After getting the diff and reading the changed files, invoke sequential thinking with this structure:

**Thought 1: Understanding the Change**
- What is the purpose of this change?
- What problem does it solve?
- What is the scope (files affected, lines changed)?

**Thought 2: Architecture Analysis**
- Does this change follow the existing patterns in the codebase?
- Are there better architectural approaches?
- Does it introduce coupling or dependencies that shouldn't exist?

**Thought 3: Code Quality Deep Dive**
- For each file, analyze: readability, maintainability, testability
- Look for hidden complexity or clever code that's hard to understand
- Consider: "Would a new developer understand this in 6 months?"

**Thought 4: Potential Issues**
- What could break? What edge cases are missing?
- Are there security implications?
- Performance concerns?

**Thought 5: Refactoring Opportunities**
- What patterns are repeated that could be abstracted?
- What could be simplified?
- What would make this code more elegant?

**Thought 6: Synthesis & Prioritization**
- Rank all findings by importance
- Distinguish between "must fix", "should fix", and "consider"
- Formulate actionable recommendations

Set `totalThoughts: 6` minimum, but use `needsMoreThoughts: true` if complex changes require deeper analysis.

### Sequential Thinking Parameters

```
thoughtNumber: 1-N (progress through analysis)
totalThoughts: 6+ (adjust based on complexity)
isRevision: true (if reconsidering earlier analysis)
needsMoreThoughts: true (if complexity warrants)
nextThoughtNeeded: false (only when truly complete)
```

## 1. Get Changes

```bash
git status
git diff --name-only
git diff --staged --name-only
```

Read ALL changed files completely before starting sequential thinking analysis.

## 2. Run Linters

```bash
pnpm lint
pnpm knip
npx tsc --noEmit
```

Include linter output in your sequential thinking analysis.

## 3. Code Smells (General)

Check ALL files for:

### Structure
- [ ] **File > 300 lines** → Split into modules
- [ ] **Function > 30 lines** → Extract subfunctions
- [ ] **Component > 150 lines** → Split into smaller components
- [ ] **Nesting > 3 levels** → Flatten with early returns
- [ ] **Parameters > 3** → Use options object

### Naming
- [ ] **Vague names** → `data`, `info`, `handle`, `process`, `item` without context
- [ ] **Boolean without prefix** → Should be `is*`, `has*`, `can*`, `should*`
- [ ] **Inconsistent naming** → Same concept named differently in different places

### Duplication & Abstraction
- [ ] **Duplicated code** → Same 3+ lines in 2+ places, extract to function
- [ ] **Copy-pasted logic** → Similar patterns that could be abstracted
- [ ] **Magic numbers/strings** → Extract to named constants

### Dead Code
- [ ] **Unused variables/imports** → Remove (knip catches this)
- [ ] **Commented-out code** → Remove, use git history
- [ ] **Unreachable code** → Code after return/throw
- [ ] **console.log** → Remove before commit

### TypeScript
- [ ] **`any` type** → Replace with proper type or `unknown`
- [ ] **Type assertions `as`** → Prefer type guards
- [ ] **Missing return types** → Add explicit types to exported functions
- [ ] **Optional fields for states** → Use discriminated unions

## 4. Convex Issues

Check `convex/**/*.ts` files for:

### Validators (CRITICAL)
- [ ] **Missing `returns` validator** → Every query/mutation needs `returns: v.*()`
- [ ] **Missing `args` validators** → Never use `args: {}` with untyped handler

### Queries
- [ ] **Using `.filter()`** → MUST use `.withIndex()` instead (full table scan!)
- [ ] **Index doesn't exist** → Verify index in schema.ts before using
- [ ] **`.collect()` on large data** → Risk of memory issues, consider pagination
- [ ] **Missing `.order()`** → Specify ordering explicitly

### Performance
- [ ] **N+1 queries** → Loop with `ctx.db.get()` inside? Use `Promise.all()` + batch
- [ ] **Sequential awaits** → Independent queries should use `Promise.all()`
- [ ] **Redundant queries** → Same data fetched multiple times

### Security
- [ ] **Missing auth check** → Mutations should call `requireAuth()` or similar
- [ ] **Trusting client IDs** → Never use `args.userId`, get from `ctx.auth`
- [ ] **Missing org isolation** → Verify `organizationId === auth.organization._id`
- [ ] **Error leaking info** → Return `null` not "User X not found"

### Architecture
- [ ] **Public should be internal** → Helper functions should use `internalQuery/Mutation`
- [ ] **try/catch swallowing errors** → Let errors propagate
- [ ] **Action calling ctx.db** → Actions must use `ctx.runQuery`/`ctx.runMutation`
- [ ] **Wrong index naming** → Use `by_fieldName`, not `by_field_and_field`

## 5. React/Next.js Issues

Check `src/**/*.tsx` files for:

### Components
- [ ] **Unnecessary `"use client"`** → No hooks, events, or browser APIs? Remove
- [ ] **Missing loading state** → `useQuery` returns `undefined` initially
- [ ] **Missing Suspense** → Async server components need `<Suspense>`
- [ ] **Missing key in lists** → Using index as key? Use unique ID

### Data Fetching
- [ ] **Client fetch could be server** → Can parent server component fetch this?
- [ ] **Multiple preloadQuery calls** → Data inconsistency risk, combine queries

### Forms
- [ ] **Form without Zod** → All forms need Zod schema + zodResolver
- [ ] **Missing disabled state** → `disabled={!isValid || isSubmitting}`
- [ ] **Edit form without isDirty** → Should be `disabled={!isDirty || !isValid}`

### Styling
- [ ] **Not using `cn()`** → Conditional classes should use `cn()` utility
- [ ] **Relative imports** → Use `@/` path aliases

### Hooks
- [ ] **Missing useEffect deps** → All dependencies must be listed
- [ ] **Derived state in useEffect** → Use `useMemo` instead
- [ ] **Prop drilling > 3 levels** → Consider context

## 6. Standardization Opportunities

Scan changed files for **repeated patterns** that could be abstracted. Think holistically about the codebase.

### How to Identify Patterns

Look for code/logic that appears in 2+ places with slight variations:
- Similar UI structures (layouts, cards, lists, modals)
- Same business logic (validations, transformations, calculations)
- Repeated visual patterns (colors, spacing, typography choices)
- Similar data handling (fetching, formatting, filtering)
- Common state patterns (loading, error, empty, success)

### Questions to Ask

For each repeated pattern found, ask:
1. **Is this the same concept?** → Same thing done in different places
2. **What varies?** → Identify the 1-3 things that change between usages
3. **What stays constant?** → The structure/logic that's always the same

### Abstraction Options

Choose the right abstraction based on what you found:

| Pattern Type | Abstraction | Location |
|--------------|-------------|----------|
| UI structure | Reusable component | `src/components/shared/` or feature folder |
| Visual values | Constants/config | `src/lib/constants.ts` or feature config |
| Business logic | Utility function | `src/lib/utils/` or feature utils |
| State + logic | Custom hook | `src/hooks/` or feature hooks |
| Data shapes | Shared types | `src/types/` or colocated |
| API patterns | Helper in convex/lib | `convex/lib/` |

### Before Suggesting New Abstractions

Check what already exists:
- `src/components/shared/` → Shared components
- `src/components/ui/` → shadcn/ui base components
- `src/lib/` → Utilities and constants
- `convex/lib/` → Backend helpers
- Feature-specific folders → May already have local abstractions

### Report Format

When opportunities found, add to report:

```markdown
### Standardization Opportunities
| Pattern Found | Where | Suggested Abstraction |
|---------------|-------|----------------------|
| [describe pattern] | file1, file2 | [component/config/hook/utility] |
```

## 7. Report

```markdown
## Pre-Commit Review

**Files changed:** X
**Lines added/removed:** +X / -X

### Critical (Must Fix)
| File:Line | Issue | Category |
|-----------|-------|----------|

### Should Fix
| File:Line | Issue | Category |
|-----------|-------|----------|

### Consider
| File:Line | Issue | Category |
|-----------|-------|----------|

### Standardization Opportunities
| Pattern | Files Affected | Suggestion |
|---------|----------------|------------|
<!-- List patterns that could be abstracted: colors, badges, components -->

### Ready to Commit?
- [ ] Critical issues: 0
- [ ] pnpm lint: passes
- [ ] pnpm knip: passes
- [ ] npx tsc --noEmit: passes
```

## 8. Offer to Fix

After presenting the report, use the `AskUserQuestion` tool to offer specific fix options.

### Question Structure

Use this format with `AskUserQuestion`:

```
Question: "What would you like me to fix?"
Header: "Fix scope"
Options:
1. "Critical only" - Fix only Must Fix issues (security, bugs, breaking changes)
2. "Critical + Should Fix" - Fix Must Fix + Should Fix issues (recommended)
3. "Everything" - Fix all issues including Consider items and apply Standardization opportunities
4. "Skip fixes" - Don't fix anything, just commit as-is
```

### After User Selection

Based on the user's choice:

| Option | Actions |
|--------|---------|
| **Critical only** | Fix only items in "Critical (Must Fix)" table |
| **Critical + Should Fix** | Fix items in "Critical" + "Should Fix" tables |
| **Everything** | Fix all tables + implement Standardization suggestions |
| **Skip fixes** | Do nothing, user will commit manually |

### Implementation Notes

- After fixing, re-run linters to verify fixes didn't introduce new issues
- If user selects "Other", they can specify exactly what to fix
- Always show a summary of what was fixed before finishing

---

## Complete Workflow Summary

```
1. git status + git diff → Get list of changed files
2. Read ALL changed files completely
3. Run linters (pnpm lint, knip, tsc)
4. ⭐ SEQUENTIAL THINKING (6+ thoughts):
   │
   ├─ Thought 1: Understand the change (purpose, scope)
   ├─ Thought 2: Architecture analysis (patterns, coupling)
   ├─ Thought 3: Code quality deep dive (readability, complexity)
   ├─ Thought 4: Potential issues (bugs, security, performance)
   ├─ Thought 5: Refactoring opportunities (abstractions, simplifications)
   └─ Thought 6: Synthesis (prioritize, categorize findings)

5. Apply checklists (§3-§6) with insights from thinking
6. Generate structured report
7. ⭐ OFFER FIX OPTIONS (use AskUserQuestion):
   │
   ├─ Option 1: Critical only
   ├─ Option 2: Critical + Should Fix (recommended)
   ├─ Option 3: Everything (all issues + standardization)
   └─ Option 4: Skip fixes

8. Apply fixes based on selection
9. Re-run linters to verify
10. Show summary of changes made
```

### Why Sequential Thinking is Required

- **Surface scanning misses context**: Without deep thinking, reviews become checkbox exercises
- **Connections between issues**: Sequential thinking reveals patterns across files
- **Better refactoring suggestions**: Deep analysis leads to meaningful improvements, not just lint fixes
- **Holistic understanding**: Thinking about architecture reveals issues that checklists miss

### Example Sequential Thinking Invocation

```json
{
  "thought": "Looking at the staged changes, I see modifications to 3 files: user-reservations-client.tsx, reservation-status-badge.tsx, and reservations.ts. The main change appears to be adding a history view for reservations. Let me understand the full scope...",
  "thoughtNumber": 1,
  "totalThoughts": 6,
  "nextThoughtNeeded": true
}
```

Continue through all thoughts, using `isRevision: true` if you need to reconsider earlier analysis, and `needsMoreThoughts: true` if complexity warrants additional thoughts.
