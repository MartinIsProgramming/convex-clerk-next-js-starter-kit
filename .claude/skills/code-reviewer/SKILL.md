---
name: code-reviewer
description: Review and refactor code after commits. Use AFTER a builder skill completes and commits. Analyzes for clean code violations, identifies refactoring opportunities, and suggests improvements. Checks function length, file size, naming, duplication, and architectural patterns. Works with any codebase but has specific patterns for Next.js/React.
---

# Code Reviewer

Run after builder commits to identify refactoring opportunities.

## Workflow

1. **Get changed files** → `git diff --name-only HEAD~1` (or specified commit range)
2. **Analyze each file** → Check against rules in references/clean-code.md
3. **Categorize issues:**
   - 🔴 **Must fix** → Bugs, security issues, broken patterns
   - 🟡 **Should fix** → Clean code violations, maintainability issues
   - 🟢 **Consider** → Style improvements, minor optimizations
4. **For Next.js/React files** → Also check references/nextjs-patterns.md
5. **Report findings** → Group by file, prioritize by severity
6. **Offer to fix** → "Want me to refactor [specific issue]?"

## Quick Checks (run mentally on every file)

```
FILE LEVEL:
├── Lines > 300? → Split into modules
├── Multiple responsibilities? → Separate concerns
└── Unclear name? → Rename to reflect purpose

FUNCTION LEVEL:
├── Lines > 30? → Extract subfunctions
├── Parameters > 3? → Use options object
├── Nested > 3 levels? → Flatten with early returns
└── Does multiple things? → Split by responsibility

CODE SMELLS:
├── Duplicated code (3+ lines, 2+ places)? → Extract to shared function
├── Magic numbers/strings? → Extract to constants
├── Comments explaining "what"? → Code should be self-documenting
└── Dead code? → Remove it
```

## Output Format

```markdown
## Code Review: [commit hash]

### 🔴 Must Fix
- **[file:line]** [Issue]: [Brief explanation]

### 🟡 Should Fix  
- **[file:line]** [Issue]: [Brief explanation]

### 🟢 Consider
- **[file:line]** [Suggestion]: [Brief explanation]

### Summary
- X files reviewed
- X issues found (X critical, X warnings, X suggestions)

Want me to refactor any of these?
```

## References

- **Clean code rules** → references/clean-code.md (general principles)
- **Next.js patterns** → references/nextjs-patterns.md (framework-specific)
- **Refactoring recipes** → references/refactoring-recipes.md (how to fix common issues)
