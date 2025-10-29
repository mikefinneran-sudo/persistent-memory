# Persistent Memory System - Project Overview

**Technical documentation for Claude Code's memory system**

---

## What Problem Does This Solve?

### The Problem
- Claude starts each session with no memory of previous work
- Users have to re-explain context every time
- No way to track projects across sessions
- Lost progress when switching between projects
- Inefficient use of time repeating information

### The Solution
A structured file system that Claude can read to:
- Remember user preferences
- Track active projects
- Resume work instantly
- Switch context seamlessly
- Never lose progress

---

## Architecture

### 4-Layer Design

```
Layer 1: Global Preferences (CLAUDE.md)
    ↓
Layer 2: Project Registry (PROJECT-REGISTRY.md)
    ↓
Layer 3: Project Workspaces (projects/[name]/)
    ↓
Layer 4: Working Context (WORKING-CONTEXT.md)
```

**Why this works**:
- **Separation of concerns**: Global vs project-specific
- **Scalability**: Add projects without bloating global memory
- **Fast loading**: Only read what's needed
- **Easy maintenance**: Update one layer without affecting others

---

## Layer 1: Global Preferences

**File**: `~/.claude/CLAUDE.md`

**Purpose**: Information that applies to ALL sessions

**Contents**:
- User profile (name, email, use case)
- Communication style preferences
- File naming conventions
- Workflow principles
- Default file locations

**Size**: ~150 lines (3-5 KB)

**Loaded**: Automatically every session (built into Claude Code)

**Update frequency**: Rare (only when preferences change)

**Design principle**: Keep minimal - only truly global information

---

## Layer 2: Project Registry

**File**: `~/.claude/PROJECT-REGISTRY.md`

**Purpose**: Quick directory of all active projects

**Contents**:
- Table of projects (name, status, priority, location)
- Quick links to README files
- Project descriptions (1-2 sentences)

**Size**: ~50 lines (2-3 KB)

**Loaded**: When checking projects or switching context

**Update frequency**: Weekly or when projects change

**Design principle**: Quick lookup, not detailed info

**Format**:
```markdown
| Project | Status | Priority | Location | Link |
|---------|--------|----------|----------|------|
| LifeHub | Active | Medium | ~/.claude/projects/lifehub-2.0 | [README](link) |
```

---

## Layer 3: Project Workspaces

**Location**: `~/.claude/projects/[project-name]/`

**Purpose**: Complete context for a specific project

**Structure**:
```
project-name/
├── README.md      # Navigation hub (start here)
├── PROJECT.md     # Overview, vision, architecture
├── STATUS.md      # Current state, what's working
├── BACKLOG.md     # Prioritized tasks
├── QUICKREF.md    # One-page cheat sheet (optional)
├── DECISIONS.md   # Major decisions (optional)
└── NOTES.md       # Ongoing learnings (optional)
```

**Essential files**: README, PROJECT, STATUS, BACKLOG

**Size per project**: 50-200 KB total

**Loaded**: When user says "continue [project]"

**Update frequency**:
- README: Rarely (only major changes)
- PROJECT: Rarely (architectural changes)
- STATUS: Every session (Claude updates)
- BACKLOG: As needed (tasks change)

**Design principle**: Self-contained - everything about THIS project

---

## Layer 4: Working Context

**File**: `~/.claude/WORKING-CONTEXT.md`

**Purpose**: What you're focused on RIGHT NOW

**Contents**:
- This week's primary focus
- What was completed (this session)
- Active files/locations
- Current state
- Next actions
- Open questions
- Session log

**Size**: ~100 lines (5-8 KB)

**Loaded**: Every session start

**Update frequency**: Every session (Claude updates automatically)

**Reset**: Weekly (every Monday)

**Design principle**: Current work only - archives history

---

## File Formats

### All Files Use Markdown

**Why Markdown?**
- Human-readable
- Easy to edit
- Git-friendly
- Supports tables, lists, links
- Works everywhere

**Conventions**:
- Headers: `#` for h1, `##` for h2, etc.
- Lists: `-` for unordered, `1.` for ordered
- Tables: Markdown table syntax
- Code blocks: Triple backticks
- Links: `[text](url)` or `[text](relative-path)`

---

## Memory Loading Strategy

### Session Start

**User says**: "What am I working on?"

**Claude executes**:
```
1. Read CLAUDE.md (always loaded automatically)
2. Read WORKING-CONTEXT.md → Get current focus
3. Read PROJECT-REGISTRY.md → Verify project status
4. Respond with context
```

**Time**: < 1 second
**Tokens**: ~500-1000

---

### Continue Project

**User says**: "Continue [project-name]"

**Claude executes**:
```
1. Check PROJECT-REGISTRY.md → Get project location
2. Read projects/[name]/README.md → Navigation
3. Read projects/[name]/STATUS.md → Current state
4. Read projects/[name]/BACKLOG.md → Next tasks
5. Update WORKING-CONTEXT.md → Record focus change
6. Respond ready to work
```

**Time**: < 2 seconds
**Tokens**: ~2000-4000

---

### End Session

**Claude executes**:
```
1. Update WORKING-CONTEXT.md:
   - Add completed tasks
   - Note next actions
   - Record open questions

2. Update project STATUS.md (if changed):
   - Feature completion percentages
   - What's now working
   - New issues discovered

3. Update project BACKLOG.md (if changed):
   - Mark completed tasks
   - Add new tasks
   - Adjust priorities
```

**Automatic**: No user action needed

---

## Data Flow

### Information Flow

```
User Input
    ↓
Claude reads relevant memory files
    ↓
Claude has full context
    ↓
Work is done
    ↓
Claude updates memory files
    ↓
Context saved for next session
```

### File Dependencies

```
CLAUDE.md (global)
    ↑
    └─── Always loaded

PROJECT-REGISTRY.md
    ↑
    └─── Loaded when checking/switching projects

WORKING-CONTEXT.md
    ↑
    └─── Loaded every session
    ↓
    └─── Points to current project

projects/[name]/*
    ↑
    └─── Loaded when working on that project
```

---

## Size Management

### Target Sizes

| File | Lines | Size | Why |
|------|-------|------|-----|
| CLAUDE.md | ~150 | 3-5 KB | Fast loading, global only |
| PROJECT-REGISTRY.md | ~50 | 2-3 KB | Quick lookup |
| WORKING-CONTEXT.md | ~100 | 5-8 KB | Current week only |
| Project README | ~300 | 10-15 KB | Navigation hub |
| Project PROJECT | ~500 | 15-20 KB | Deep context |
| Project STATUS | ~400 | 12-18 KB | Current state |
| Project BACKLOG | ~600 | 18-25 KB | All tasks |

**Total per project**: 50-200 KB
**Total system**: < 1 MB for 5 projects

### Why Small Sizes Matter

1. **Fast loading**: < 2 seconds to full context
2. **Low token usage**: More room for actual work
3. **Easy maintenance**: Less to read and update
4. **Focused content**: No bloat or noise

---

## Maintenance Strategy

### Automatic (Claude)

**Every session**:
- Update WORKING-CONTEXT.md
- Update project STATUS.md if features changed
- Update project BACKLOG.md if tasks completed
- Archive completed items

**No user action needed**

---

### Weekly (User - 10 minutes)

**Monday morning**:
1. Review WORKING-CONTEXT.md
2. Update PROJECT-REGISTRY.md if projects changed
3. Optionally reset WORKING-CONTEXT.md for new week

**Why weekly**: Keeps registry current, resets focus

---

### Monthly (User - 30 minutes)

**Last day of month**:
1. Archive completed projects → `projects/archive/`
2. Review CLAUDE.md for outdated info
3. Clean up stale content
4. Check project sizes

**Why monthly**: Prevents accumulation, keeps system lean

---

## Scaling Strategy

### Current: Personal Use (1 user, 3-5 projects)

**Works perfectly**:
- Files are small
- Quick to load
- Easy to maintain
- No conflicts

---

### Future: Team Use (Multiple users, many projects)

**Would need**:
- Per-user CLAUDE.md files
- Shared PROJECT-REGISTRY.md
- Per-user WORKING-CONTEXT.md
- Shared project workspaces
- Git for version control

**Not implemented yet** - current system is personal only

---

## Design Decisions

### Why Not a Database?

**Considered**: SQLite, JSON files

**Chose Markdown because**:
- Human-readable (can edit directly)
- Git-friendly (version control)
- No dependencies (just text files)
- Cross-platform (works everywhere)
- Future-proof (will work forever)

**Trade-off**: Slower queries, but acceptable for small scale

---

### Why File-Based vs Cloud?

**Considered**: Google Drive sync, cloud storage

**Chose local files because**:
- Privacy (no data leaves machine)
- Speed (instant access)
- Reliability (works offline)
- Control (user owns data)
- Simplicity (no API, no auth)

**Trade-off**: No cross-machine sync, but acceptable for single-machine use

---

### Why 4 Layers?

**Considered**: Single file, 2 layers, 5 layers

**Chose 4 layers because**:
- Layer 1 (Global): Rarely changes
- Layer 2 (Registry): Quick lookup
- Layer 3 (Projects): Deep context
- Layer 4 (Working): Current only

**Balance**: Not too flat (bloat), not too deep (complexity)

---

## Performance

### Load Times

**Session start**: < 1 second
- CLAUDE.md: 150 lines (automatic)
- WORKING-CONTEXT.md: 100 lines

**Continue project**: < 2 seconds
- README: 300 lines
- STATUS: 400 lines
- BACKLOG: 600 lines

**Total**: 1300 lines in 2 seconds

---

### Token Usage

**Typical session start**: ~1000 tokens
- CLAUDE.md: ~400 tokens
- WORKING-CONTEXT.md: ~300 tokens
- Registry check: ~200 tokens
- Project README: ~800 tokens

**Leaves**: 199,000 tokens for actual work (out of 200,000 context window)

**Efficient**: < 1% of context used for memory

---

## Security & Privacy

### What's Stored

**In memory files**:
- Your name, email, preferences
- Project names and descriptions
- File paths on your machine
- Work progress and status
- Technical details

**Not stored**:
- Passwords or credentials
- API keys or tokens
- Sensitive business data
- Personal information beyond name/email

---

### Location Security

**All files**: `~/.claude/` (in your home directory)

**Permissions**: User-only (700)

**Backup**: Your responsibility (Git, Time Machine, etc.)

**Sharing**: Never share Claude directory publicly (contains your info)

---

## Future Enhancements

### Possible Additions

1. **Auto-archiving**: Move old projects automatically
2. **Search**: Find info across all memory files
3. **Metrics**: Track time spent per project
4. **Sync**: Optional cloud backup
5. **Templates**: Standard project structures
6. **Visualizations**: Project status dashboards

### Not Planned

- Multi-user support (complex, out of scope)
- Database migration (files work well)
- Web interface (command line is fine)
- Real-time sync (not needed for personal use)

---

## Technical Specifications

### File Format

**Extension**: `.md` (Markdown)
**Encoding**: UTF-8
**Line endings**: LF (Unix-style)
**Max size**: 100 KB per file (guideline)

---

### Directory Structure

```
~/.claude/
├── CLAUDE.md                          # 150 lines, 3-5 KB
├── PROJECT-REGISTRY.md                # 50 lines, 2-3 KB
├── WORKING-CONTEXT.md                 # 100 lines, 5-8 KB
├── PERSISTENT-MEMORY-STRATEGY.md      # Documentation
│
└── projects/
    ├── [project-name]/                # Per project
    │   ├── README.md                  # 300 lines, 10-15 KB
    │   ├── PROJECT.md                 # 500 lines, 15-20 KB
    │   ├── STATUS.md                  # 400 lines, 12-18 KB
    │   ├── BACKLOG.md                 # 600 lines, 18-25 KB
    │   └── QUICKREF.md (optional)     # 200 lines, 8-10 KB
    │
    ├── persistent-memory/             # This documentation
    └── archive/                       # Completed projects
```

---

### Naming Conventions

**Files**: UPPERCASE-WITH-HYPHENS.md or lowercase-with-hyphens.md
**Folders**: lowercase-with-hyphens
**Projects**: lowercase-with-hyphens (matches folder name)

**Examples**:
- CLAUDE.md ✅
- PROJECT-REGISTRY.md ✅
- lifehub-2.0/ ✅
- README.md ✅

---

## Summary

**What we built**:
- 4-layer persistent memory system
- File-based, Markdown format
- Automatic updates by Claude
- Minimal maintenance (10 min/week)

**Key features**:
- Fast loading (< 2 seconds)
- Low token usage (< 1% of context)
- Privacy-first (local files only)
- Human-readable (can edit directly)

**Result**:
- Never repeat context
- Seamless project switching
- Clear progress tracking
- Efficient use of Claude's memory

---

**Created**: 2025-10-27
**Version**: 1.0
**Status**: Production-ready
**Owner**: Mike Finneran
