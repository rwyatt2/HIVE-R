# Prompting Guide

Get the best results from HIVE-R with effective prompts.

## Prompt Structure

Good prompts include:

1. **What** you want to build
2. **Context** about the project
3. **Preferences** for tech/style

### Example

```
Build a user profile page for a social app.

Context:
- React with TypeScript
- Tailwind CSS for styling
- Dark theme preferred

Features:
- Avatar upload
- Edit name/bio
- Activity feed section
```

## Prompt Patterns

### Feature Request

```
Add [feature] to [component] that allows users to [action].

Requirements:
- [requirement 1]
- [requirement 2]
```

### Bug Fix

```
The [component] is [describing the bug].

Expected: [what should happen]
Actual: [what happens]

Please fix and add a test.
```

### Refactoring

```
Refactor [code] to:
- [improvement 1]
- [improvement 2]

Keep the existing API/behavior.
```

### Design Request

```
Design a [component] in the style of [reference].

Requirements:
- [visual requirement]
- [interaction requirement]
- Mobile responsive
```

## Best Practices

### Be Specific

❌ "Build a form"

✅ "Build a contact form with name, email, and message fields. Include validation, error states, and a success message. Use a gradient submit button."

### Provide Context

❌ "Add authentication"

✅ "Add JWT authentication to the Express API. Use bcrypt for passwords, store refresh tokens in the database, and include 15-minute access token expiry."

### Iterate

Don't try to build everything at once:

1. "Build the basic component structure"
2. "Add form validation"
3. "Style with the dark theme"
4. "Add tests"

### Reference Existing Code

```
Following the pattern in UserCard.tsx, create a ProfileCard component that shows extended user info.
```

## Agent-Specific Tips

### For Designer 🎨

- Include color preferences
- Reference existing design systems
- Specify dark/light mode requirements

### For Builder 🛠️

- Mention preferred libraries
- Specify TypeScript strictness
- Note any patterns to follow

### For Security 🔒

- Describe the threat model
- Mention compliance requirements (HIPAA, SOC2)
- List sensitive data types

### For Tester 🧪

- Specify test framework preferences
- Mention coverage targets
- List critical paths to test
