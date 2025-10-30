# Persistent Memory System - User Guide

**How to use Claude Code's persistent memory effectively**

Version 1.0 | Created: 2025-10-27

---

## What is Persistent Memory?

Persistent memory lets Claude Code remember information across sessions. Instead of explaining your setup every time, Claude can read files that contain:
- Your preferences
- Active projects
- Current work
- Past decisions

**Think of it as**: Claude's long-term memory about you and your work.

---

## Quick Start (5 minutes)

### 1. Check What You Have

```bash
# See your global preferences
cat ~/.claude/CLAUDE.md

# See your active projects
cat ~/.claude/PROJECT-REGISTRY.md

# See what you're working on
cat ~/.claude/WORKING-CONTEXT.md
```

### 2. Start Any Session

Just say one of these:
- "What am I working on?"
- "Continue [project-name]"
- "Show me my active projects"

Claude will read the memory files and know exactly where you are.

### 3. That's It!

Claude automatically updates memory files as you work. No manual maintenance needed.

---

## The 4-Layer System

### Layer 1: Global Preferences (CLAUDE.md)

**What it is**: Your personal preferences that apply everywhere

**Location**: `~/.claude/CLAUDE.md`

**What's in it**:
- Your name and email
- Communication style preferences
- File naming conventions
- Workflow principles
- Default file locations

**When it's loaded**: Automatically, every session

**When to update**: Rarely - only when preferences change

**Example use**:
```
You: "Save this to my guides folder"
Claude: *Reads CLAUDE.md* → Knows guides = Google Drive link
Claude: *Saves to correct location*
```

---

### Layer 2: Project Registry (PROJECT-REGISTRY.md)

**What it is**: A table of all your active projects

**Location**: `~/.claude/PROJECT-REGISTRY.md`

**What's in it**:
- Project names
- Status (Active, Planning, Research, Paused)
- Priority (High, Medium, Low)
- Location of project files
- Quick links to README files

**When it's loaded**: When you ask about projects or say "continue [project]"

**When to update**: Weekly or when starting/pausing projects

**Example use**:
```
You: "What projects am I working on?"
Claude: *Reads PROJECT-REGISTRY.md*
Claude: "You have 3 active projects: LifeHub (Medium), ProjectX (High), Granola (Low)"
```

---

### Layer 3: Project Workspaces

**What it is**: A folder for each significant project with complete context

**Location**: `~/.claude/projects/[project-name]/`

**What's in it**:
- `README.md` - Navigation hub (start here)
- `PROJECT.md` - Overview, vision, architecture
- `STATUS.md` - Current state, what's working
- `BACKLOG.md` - Prioritized tasks
- `QUICKREF.md` - One-page cheat sheet (optional)

**When it's loaded**: When you say "continue [project]"

**When to update**: Claude updates STATUS and BACKLOG every session

**Example use**:
```
You: "Continue LifeHub"
Claude: *Reads ~/.claude/projects/lifehub-2.0/README.md*
Claude: *Checks STATUS.md for current state*
Claude: *Reviews BACKLOG.md for next tasks*
Claude: "LifeHub is 70% complete. Automation is working. Next task: test Notion integration. Want to start?"
```

---

### Layer 4: Working Context (WORKING-CONTEXT.md)

**What it is**: What you're focused on RIGHT NOW (this week)

**Location**: `~/.claude/WORKING-CONTEXT.md`

**What's in it**:
- This week's primary focus
- What you just completed (this session)
- Active files/locations
- Current state
- Next actions
- Open questions

**When it's loaded**: Every session start

**When to update**: Claude updates it every session, you review weekly

**Example use**:
```
You: "What did we do last session?"
Claude: *Reads WORKING-CONTEXT.md*
Claude: "We fixed LifeHub automation scripts, created LaunchAgents, and prepared a package for Omar. The email is ready to send."
```

---

## Common Commands

### See What You're Working On

```bash
# Quick view
cat ~/.claude/WORKING-CONTEXT.md

# Just the summary
head -20 ~/.claude/WORKING-CONTEXT.md
```

### Check Active Projects

```bash
# Full registry
cat ~/.claude/PROJECT-REGISTRY.md

# Just the table
grep -A 10 "Active Projects" ~/.claude/PROJECT-REGISTRY.md
```

### Open a Project

```bash
# Navigate to project
cd ~/.claude/projects/lifehub-2.0

# Read the README
cat README.md

# Check status
cat STATUS.md

# See what's next
cat BACKLOG.md
```

### Review Global Preferences

```bash
# See all preferences
cat ~/.claude/CLAUDE.md

# Just user profile
head -20 ~/.claude/CLAUDE.md
```

---

## How Claude Uses Memory

### When You Start a Session

**You say**: "Hey Claude, what should I work on?"

**Claude does**:
1. Reads `WORKING-CONTEXT.md` → Sees you were working on LifeHub
2. Reads `PROJECT-REGISTRY.md` → Confirms LifeHub is Active (Medium priority)
3. Reads `~/.claude/projects/lifehub-2.0/STATUS.md` → Sees automation is 90% done
4. Reads `~/.claude/projects/lifehub-2.0/BACKLOG.md` → Finds next task

**Claude responds**: "You were working on LifeHub. The automation is set up and tested. Next task is testing Notion integration (LIFE-002). Want to do that?"

---

### When You Say "Continue [Project]"

**You say**: "Continue LifeHub"

**Claude does**:
1. Checks `PROJECT-REGISTRY.md` → Gets project location
2. Reads `~/.claude/projects/lifehub-2.0/README.md` → Gets overview and commands
3. Reads `STATUS.md` → Understands current state
4. Reads `BACKLOG.md` → Knows what's next
5. Updates `WORKING-CONTEXT.md` → Records you're back on LifeHub

**Claude responds**: With full context, ready to work immediately

---

### When You Complete Work

**During the session**, Claude:
- Takes notes on what you accomplished
- Identifies what changed

**At end of session**, Claude:
- Updates `WORKING-CONTEXT.md` with completed tasks
- Updates project `STATUS.md` if features changed
- Updates project `BACKLOG.md` if tasks done
- Marks completed items

**Next session**: Everything is current, no context loss

---

## Weekly Maintenance (10 minutes)

### Monday Morning Routine

**1. Review Working Context**:
```bash
cat ~/.claude/WORKING-CONTEXT.md
```
- What did you accomplish last week?
- What's the focus this week?

**2. Update Project Registry** (if needed):
```bash
nano ~/.claude/PROJECT-REGISTRY.md
```
- Any projects to add?
- Any to pause or archive?
- Priorities changed?

**3. Reset Working Context** (optional):
```bash
nano ~/.claude/WORKING-CONTEXT.md
```
- Update "Week of" date
- Set new weekly goals
- Clear completed items

**That's it!** 10 minutes keeps everything current.

---

## Creating a New Project

### When to Create a Project Workspace

**DO create** when:
- ✅ You'll work on it for more than 2-3 sessions
- ✅ It has multiple tasks or complexity
- ✅ You'll come back to it over weeks/months
- ✅ You want Claude to remember the context

**DON'T create** for:
- ❌ One-off tasks
- ❌ Simple questions
- ❌ Quick file edits
- ❌ Research that takes < 1 hour

### How to Create

**Option 1 - Ask Claude**:
```
You: "Create a project workspace for [project-name]"
Claude: *Creates folder and essential files*
Claude: *Adds to PROJECT-REGISTRY.md*
```

**Option 2 - Manual**:
```bash
# Create folder
mkdir -p ~/.claude/projects/my-new-project

# Create essential files
cd ~/.claude/projects/my-new-project
touch README.md PROJECT.md STATUS.md BACKLOG.md

# Add to registry
nano ~/.claude/PROJECT-REGISTRY.md
# Add a row to the Active Projects table
```

### Essential Files

**1. README.md** (Navigation hub):
```markdown
# Project Name

Quick overview and how to get started.

## Quick Commands
- Command 1
- Command 2

## File Locations
- Key files here

## How to Resume
1. Read this
2. Check STATUS.md
3. Pick from BACKLOG.md
```

**2. PROJECT.md** (Deep context):
```markdown
# Project Name - Overview

## Vision
What are you building and why?

## Technical Details
Architecture, tools, dependencies

## Key Decisions
Major choices and rationale

## Resources
Links, docs, references
```

**3. STATUS.md** (Current state):
```markdown
# Project Status

## Feature Completeness
- Feature A: 80%
- Feature B: 20%

## What's Working
- List working features

## What's Not Working
- Known issues

## Next Priorities
- Top 3 things to do
```

**4. BACKLOG.md** (Tasks):
```markdown
# Project Backlog

## High Priority
- [ ] Task 1
- [ ] Task 2

## Medium Priority
- [ ] Task 3

## Low Priority
- [ ] Task 4

## Completed
- [x] Task 0
```

---

## Best Practices

### 1. Keep Global Memory Lean

**Good CLAUDE.md**:
- Your name and email
- Communication preferences
- File conventions
- Workflow principles

**Bad CLAUDE.md**:
- Long lists of active projects (use PROJECT-REGISTRY instead)
- Specific project details (use project workspaces)
- Outdated information
- Copy-pasted instructions

**Target size**: ~150 lines

---

### 2. Update PROJECT-REGISTRY Weekly

**Every Monday**:
- Review active projects
- Update status/priority if changed
- Add new projects
- Pause or archive completed ones

**Keep it accurate**: If Claude sees a project as "Active" but you're not working on it, update the status.

---

### 3. Let Claude Manage Working Context

**You don't need to update**: `WORKING-CONTEXT.md` manually

**Claude does it automatically**:
- Records what you completed
- Notes next actions
- Tracks open questions
- Updates current focus

**You just review**: At start of each week

---

### 4. Use Project Workspaces for Everything Non-Trivial

**If you'll spend >2 hours on it** → Create a workspace

**Why**:
- Claude remembers all context
- You can pause and resume easily
- No explaining things twice
- Clear progress tracking

---

### 5. Archive Completed Projects

**When done**:
```bash
# Move to archive
mv ~/.claude/projects/old-project ~/.claude/projects/archive/old-project

# Update registry
nano ~/.claude/PROJECT-REGISTRY.md
# Move to "Completed Projects" section
```

**Why**: Keeps active projects list clean and focused

---

## Troubleshooting

### "Claude doesn't remember what I'm working on"

**Check**:
```bash
cat ~/.claude/WORKING-CONTEXT.md
```

**Fix**: Update with current focus:
```bash
nano ~/.claude/WORKING-CONTEXT.md
# Add: Primary Focus This Week: [project-name]
```

---

### "Claude loads wrong project context"

**Check**:
```bash
cat ~/.claude/PROJECT-REGISTRY.md
```

**Fix**: Make sure project name matches folder name exactly

---

### "Memory files are too long/cluttered"

**Check sizes**:
```bash
wc -l ~/.claude/CLAUDE.md
wc -l ~/.claude/projects/*/STATUS.md
```

**Target sizes**:
- CLAUDE.md: ~150 lines
- PROJECT-REGISTRY.md: ~50 lines
- WORKING-CONTEXT.md: ~100 lines
- Project README: ~300 lines
- Project STATUS: ~400 lines

**Fix**: Archive old content, keep only current info

---

### "I have too many active projects"

**Guideline**: 3-5 active projects max

**Fix**:
- Pause low-priority projects
- Archive completed projects
- Focus on high-priority items

---

## Advanced Tips

### 1. Use Aliases

Add to `~/.zshrc`:
```bash
# Quick memory access
alias mem='cat ~/.claude/WORKING-CONTEXT.md'
alias projects='cat ~/.claude/PROJECT-REGISTRY.md'
alias prefs='cat ~/.claude/CLAUDE.md'

# Project navigation
alias cdp='cd ~/.claude/projects'
```

---

### 2. Create Project Templates

**Save time** by having a template:
```bash
# Create template folder
mkdir -p ~/.claude/templates/project-template
cd ~/.claude/templates/project-template

# Create template files
cat > README.md << 'EOF'
# [PROJECT NAME]

## Quick Commands

## File Locations

## How to Resume
EOF

# ... more template files
```

**Use it**:
```bash
cp -r ~/.claude/templates/project-template ~/.claude/projects/new-project
```

---

### 3. Link to External Docs

**In project files**, reference external documentation:

```markdown
# Resources

## Documentation
- Architecture: /path/to/docs/architecture.md
- API Reference: https://example.com/api
- Design Specs: ~/Documents/specs/design.pdf

## Related Files
- Main codebase: /path/to/code
- Test suite: /path/to/tests
- Deployment scripts: /path/to/deploy
```

**Don't duplicate** - link instead

---

### 4. Use Quick Notes

In `WORKING-CONTEXT.md`, add:
```markdown
## Quick Notes
- Discovered bug in X (need to fix)
- Omar prefers Y format
- Deadline moved to next week
```

Claude will remember these details

---

## Real-World Examples

### Example 1: Starting Your Day

**You**:
```
Hey Claude, what should I work on today?
```

**Claude**:
- Reads WORKING-CONTEXT.md
- Sees primary focus: LifeHub
- Sees yesterday: Created package for Omar
- Checks BACKLOG: Next is test Notion integration

**Claude responds**:
```
Good morning! Yesterday we prepared the LifeHub v2.0 package for Omar.

Today's priorities from your context:
1. Wait for Omar's feedback on the package
2. Use LifeHub automation daily (dogfood it)
3. Test Notion integration if time permits

Your first automated daily note should have been created at 7 AM. Want to check if it worked?
```

---

### Example 2: Switching Projects

**You**:
```
Pause LifeHub, let's work on ProjectX
```

**Claude**:
- Updates WORKING-CONTEXT.md → Primary focus: ProjectX
- Checks PROJECT-REGISTRY.md → ProjectX is High priority
- Looks for project workspace → Finds it in Obsidian vault
- Reads project files

**Claude responds**:
```
Switching to ProjectX (High priority).

Current status: Customer research phase
Goal: Build pitch deck, reach out to potential investors
Location: /Users/username/Documents/Projects/ProjectX.md

Next action: Build pitch deck with customer value prop. Ready to start?
```

---

### Example 3: Coming Back After a Week

**You**:
```
What was I working on?
```

**Claude**:
- Reads WORKING-CONTEXT.md (from last week)
- Sees: LifeHub automation setup
- Checks project STATUS.md
- Reviews completed tasks

**Claude responds**:
```
Last week (Oct 21-27) you were working on LifeHub 2.0.

What you completed:
✅ Fixed automation scripts (encoding issues)
✅ Set up LaunchAgents for daily/weekly notes
✅ Created customer package (v2.0)
✅ Prepared email for Omar

Current state:
- Automation should be running (daily 7 AM, weekly Sunday 6 PM)
- Package ready on Desktop: LifeHub-v2.0.zip
- Email drafted for omar@fly-flat.com

Next actions:
- Send email to Omar
- Use LifeHub daily to test it
- Review automation effectiveness

Want to continue with LifeHub or switch projects?
```

---

## Summary

### The Perfect Setup

**Global (Minimal)**:
- CLAUDE.md (preferences)
- PROJECT-REGISTRY.md (project list)
- WORKING-CONTEXT.md (current focus)

**Per Project (Rich)**:
- README.md (navigation)
- PROJECT.md (overview)
- STATUS.md (current state)
- BACKLOG.md (tasks)

**Maintenance**:
- Claude updates automatically
- You review weekly (10 min)
- Archive when done

---

### Key Benefits

1. **No context loss** - Pick up exactly where you left off
2. **No repetition** - Never explain the same thing twice
3. **Clear progress** - See what's done, what's next
4. **Fast context loading** - Claude reads just what's needed
5. **Easy switching** - Move between projects seamlessly

---

### Getting Started

**Right now**:
1. Check your files exist (they do!)
2. Review WORKING-CONTEXT.md
3. Start your next session with "What am I working on?"
4. Let Claude handle the rest

**This week**:
- Use the system naturally
- Let Claude update files
- See how it works

**Next Monday**:
- Review PROJECT-REGISTRY (10 min)
- Update if needed
- Ready for next week

---

**You're set up with world-class persistent memory!** 🎉

Just work naturally - Claude will remember everything.

---

**Created**: 2025-10-27
**Version**: 1.0
**Maintained by**: Claude Code
**For**: Mike Finneran
