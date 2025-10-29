# Persistent Memory System - Documentation

**How Claude Code remembers your work across sessions**

---

## Quick Start

**New here?** → Read `USER-GUIDE.md` (15 minutes)

**Quick reference?** → Read `QUICKREF.md` (2 minutes)

**Want details?** → Read `PROJECT.md` (10 minutes)

---

## What is This?

This is documentation for Claude Code's persistent memory system - the files and structure that let Claude remember:
- Your preferences
- Active projects
- Current work
- Past decisions

**Think of it as**: Claude's filing system for your information

---

## File Structure

```
~/.claude/
├── CLAUDE.md                    # Your global preferences
├── PROJECT-REGISTRY.md          # List of active projects
├── WORKING-CONTEXT.md           # Current focus
│
└── projects/
    ├── persistent-memory/       # This documentation
    │   ├── README.md           # You are here
    │   ├── USER-GUIDE.md       # Complete guide
    │   ├── PROJECT.md          # System overview
    │   ├── STATUS.md           # Current state
    │   └── QUICKREF.md         # Cheat sheet
    │
    ├── lifehub-2.0/            # Example project
    └── [other-projects]/
```

---

## Documentation Files

| File | Purpose | Read When |
|------|---------|-----------|
| **USER-GUIDE.md** | Complete how-to guide | First time or need details |
| **QUICKREF.md** | One-page cheat sheet | Quick reference |
| **PROJECT.md** | System architecture | Understanding how it works |
| **STATUS.md** | Current state | See what's implemented |

---

## Quick Commands

### See What You're Working On
```bash
cat ~/.claude/WORKING-CONTEXT.md
```

### Check Active Projects
```bash
cat ~/.claude/PROJECT-REGISTRY.md
```

### Review Preferences
```bash
cat ~/.claude/CLAUDE.md
```

### Navigate to Project
```bash
cd ~/.claude/projects/[project-name]
cat README.md
```

---

## Common Tasks

### Start a Session
Just say: "What am I working on?"

### Continue a Project
Say: "Continue [project-name]"

### Create New Project
Say: "Create a project workspace for [project-name]"

### Check Project Status
Say: "What's the status of [project-name]?"

---

## The 4-Layer System

### Layer 1: Global Preferences
**File**: `CLAUDE.md`
**Contains**: Your preferences (name, email, style, conventions)
**Loaded**: Every session automatically

### Layer 2: Project Registry
**File**: `PROJECT-REGISTRY.md`
**Contains**: List of all active projects with status
**Loaded**: When switching projects or checking status

### Layer 3: Project Workspaces
**Location**: `~/.claude/projects/[name]/`
**Contains**: Complete context for each project
**Loaded**: When you say "continue [project]"

### Layer 4: Working Context
**File**: `WORKING-CONTEXT.md`
**Contains**: What you're focused on this week
**Loaded**: Every session start

---

## Getting Help

**Question about how to use it?**
→ Read `USER-GUIDE.md`

**Quick command lookup?**
→ Read `QUICKREF.md`

**Want to understand the architecture?**
→ Read `PROJECT.md`

**Check what's implemented?**
→ Read `STATUS.md`

---

## Maintenance

**Weekly (10 minutes)**:
- Review `PROJECT-REGISTRY.md`
- Update active project list
- Archive completed projects

**Per Session (Automatic)**:
- Claude updates `WORKING-CONTEXT.md`
- Claude updates project STATUS files
- Claude tracks completed tasks

**Monthly (30 minutes)**:
- Clean up old projects
- Archive to `projects/archive/`
- Review `CLAUDE.md` for outdated info

---

## Examples

### Example 1: First Time Setup
✅ Already done! Your system is set up and ready.

Files created:
- `~/.claude/CLAUDE.md` (your preferences)
- `~/.claude/PROJECT-REGISTRY.md` (project list)
- `~/.claude/WORKING-CONTEXT.md` (current work)

### Example 2: Starting Your Day
```
You: "What should I work on?"
Claude: *Reads WORKING-CONTEXT.md*
Claude: "Yesterday we finished LifeHub package. Today: send to Omar, test automation."
```

### Example 3: Switching Projects
```
You: "Continue WalterFetch"
Claude: *Checks PROJECT-REGISTRY → Finds location*
Claude: *Reads project README → Gets context*
Claude: "WalterFetch - PE target sourcing. Current: Build pitch deck. Ready?"
```

---

## File Locations

**Global Memory**:
- Preferences: `~/.claude/CLAUDE.md`
- Registry: `~/.claude/PROJECT-REGISTRY.md`
- Context: `~/.claude/WORKING-CONTEXT.md`

**This Documentation**:
- All files: `~/.claude/projects/persistent-memory/`

**Your Projects**:
- All projects: `~/.claude/projects/`
- Example: `~/.claude/projects/lifehub-2.0/`

**Obsidian Vault**:
- Location: `/Users/mikefinneran/Documents/ObsidianVault/`
- Projects: `ObsidianVault/Projects/`

---

## Best Practices

### DO:
✅ Keep global memory minimal (preferences only)
✅ Create project workspaces for anything >2 sessions
✅ Let Claude update files automatically
✅ Review PROJECT-REGISTRY weekly
✅ Archive completed projects

### DON'T:
❌ Put project details in CLAUDE.md
❌ Let files get stale/outdated
❌ Duplicate information across files
❌ Create projects for one-off tasks

---

## Troubleshooting

**Claude doesn't remember my work?**
→ Check `WORKING-CONTEXT.md` is up to date

**Wrong project context loaded?**
→ Verify project name in `PROJECT-REGISTRY.md` matches folder name

**Files are too long?**
→ Archive old content, keep only current info

**Too many active projects?**
→ Pause or archive, keep 3-5 active max

---

## Next Steps

**If you haven't read it yet**:
1. Read `USER-GUIDE.md` (complete how-to)
2. Read `QUICKREF.md` (quick commands)
3. Try it: "What am I working on?"

**If you've read the guide**:
1. Use the system naturally
2. Let Claude handle updates
3. Review weekly (10 min)

---

## Summary

**You have**:
- ✅ Global preferences (CLAUDE.md)
- ✅ Project registry (PROJECT-REGISTRY.md)
- ✅ Working context (WORKING-CONTEXT.md)
- ✅ Project workspaces (lifehub-2.0, etc.)
- ✅ Complete documentation (this folder)

**How it works**:
1. Claude reads memory files
2. You get instant context
3. Claude updates as you work
4. No manual maintenance needed

**Result**:
- Never repeat yourself
- Pick up where you left off
- Clear project tracking
- Seamless context switching

---

**You're ready to use persistent memory!** 🎉

Start your next session with "What am I working on?" and see it in action.

---

**Last Updated**: 2025-10-27
**Version**: 1.0
**Maintained by**: Claude Code
**For**: Mike Finneran
