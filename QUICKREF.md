# Persistent Memory - Quick Reference

**One-page cheat sheet for fast lookup**

---

## The 4 Files You Need to Know

| File | What | When |
|------|------|------|
| `~/.claude/CLAUDE.md` | Your preferences | Loads automatically |
| `~/.claude/PROJECT-REGISTRY.md` | Project list | Check weekly |
| `~/.claude/WORKING-CONTEXT.md` | Current focus | Check daily |
| `~/.claude/projects/[name]/` | Project details | When working on it |

---

## Quick Commands

### Check What You're Working On
```bash
cat ~/.claude/WORKING-CONTEXT.md
```

### See All Projects
```bash
cat ~/.claude/PROJECT-REGISTRY.md
```

### Open a Project
```bash
cd ~/.claude/projects/lifehub-2.0
cat README.md
```

### Review Preferences
```bash
cat ~/.claude/CLAUDE.md
```

---

## Common Claude Commands

### Start Your Day
```
You: "What am I working on?"
```

### Continue a Project
```
You: "Continue LifeHub"
```

### Check Project Status
```
You: "What's the status of LifeHub?"
```

### Switch Projects
```
You: "Pause LifeHub, work on WalterFetch"
```

### Create New Project
```
You: "Create a project workspace for [name]"
```

---

## File Locations

**Global Memory**:
- `~/.claude/CLAUDE.md`
- `~/.claude/PROJECT-REGISTRY.md`
- `~/.claude/WORKING-CONTEXT.md`

**Projects**:
- `~/.claude/projects/[project-name]/`

**Vault**:
- `/Users/mikefinneran/Documents/ObsidianVault/`

---

## Project Structure

Every project should have:
```
project-name/
├── README.md      # Start here
├── PROJECT.md     # Deep context
├── STATUS.md      # What's working
├── BACKLOG.md     # What's next
└── QUICKREF.md    # Cheat sheet (optional)
```

---

## Weekly Maintenance (10 min)

**Every Monday**:
1. Check `PROJECT-REGISTRY.md`
2. Update active projects if changed
3. Review `WORKING-CONTEXT.md`
4. Set focus for the week

---

## File Sizes (Keep Lean)

| File | Target |
|------|--------|
| CLAUDE.md | ~150 lines |
| PROJECT-REGISTRY.md | ~50 lines |
| WORKING-CONTEXT.md | ~100 lines |
| Project README | ~300 lines |
| Project STATUS | ~400 lines |

---

## The Memory Flow

```
You say "Continue LifeHub"
    ↓
Claude checks PROJECT-REGISTRY.md
    ↓
Claude reads ~/.claude/projects/lifehub-2.0/README.md
    ↓
Claude reads STATUS.md and BACKLOG.md
    ↓
Claude updates WORKING-CONTEXT.md
    ↓
Ready to work with full context!
```

---

## Best Practices

### ✅ DO:
- Keep CLAUDE.md minimal (preferences only)
- Create projects for anything >2 sessions
- Let Claude update files automatically
- Review registry weekly
- Archive completed projects

### ❌ DON'T:
- Put project details in CLAUDE.md
- Let files get outdated
- Duplicate information
- Create projects for one-off tasks
- Have more than 5 active projects

---

## Troubleshooting

**Claude doesn't remember?**
→ Check `WORKING-CONTEXT.md` is current

**Wrong context loaded?**
→ Verify project name matches folder name

**Files too long?**
→ Archive old content

**Too many projects?**
→ Pause or archive some

---

## Shell Aliases (Recommended)

Add to `~/.zshrc`:
```bash
alias mem='cat ~/.claude/WORKING-CONTEXT.md'
alias projects='cat ~/.claude/PROJECT-REGISTRY.md'
alias prefs='cat ~/.claude/CLAUDE.md'
alias cdp='cd ~/.claude/projects'
```

---

## Quick Navigation

**View memory**:
- `mem` → Current work
- `projects` → Project list
- `prefs` → Your preferences

**Navigate**:
- `cdp` → Go to projects folder
- `cd ~/.claude/projects/lifehub-2.0` → Open project

---

## The 4-Layer System (30 seconds)

**Layer 1**: CLAUDE.md → Global preferences (always loaded)
**Layer 2**: PROJECT-REGISTRY.md → Project list (quick lookup)
**Layer 3**: projects/[name]/ → Full context (when working)
**Layer 4**: WORKING-CONTEXT.md → Current focus (every session)

---

## Common Scenarios

### Scenario 1: Start of Day
```
You: "What should I work on?"
Claude reads WORKING-CONTEXT → tells you
```

### Scenario 2: Switch Projects
```
You: "Continue WalterFetch"
Claude reads registry → loads project → ready
```

### Scenario 3: After a Week Off
```
You: "What was I working on?"
Claude reads WORKING-CONTEXT → full recap
```

---

## Documentation

**Quick help**: This file (2 min)
**Complete guide**: `USER-GUIDE.md` (15 min)
**Architecture**: `PROJECT.md` (10 min)
**Navigation**: `README.md` (5 min)

---

## Update Schedule

| What | When | Who |
|------|------|-----|
| WORKING-CONTEXT | Every session | Claude (auto) |
| Project STATUS | Every session | Claude (auto) |
| PROJECT-REGISTRY | Weekly | You (manual) |
| CLAUDE.md | Rarely | You (manual) |

---

## Key Insight

**Minimal global + Rich projects + Current tracking = Perfect memory**

Keep CLAUDE.md lean, make projects detailed, track current work.

---

## Getting Help

**Question?** → Read `USER-GUIDE.md`
**Need details?** → Read `PROJECT.md`
**Can't find something?** → Read `README.md`

---

**That's it!** Simple system, powerful results.

---

**Created**: 2025-10-27
**Version**: 1.0
**For**: Mike Finneran
