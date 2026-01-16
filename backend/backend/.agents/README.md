# 🏛️ SOVR AI Cabinet

> **The multi-agent governance framework for SOVR Development Holdings LLC**

---

## Quick Start

| I need to... | Go to... |
|--------------|----------|
| Understand the Cabinet structure | [Specialist Profiles](SPECIALIST_PROFILES.md) |
| Review Agent architectural patterns | [Agent Architectural Patterns](AGENT_ARCHITECTURAL_PATTERNS.md) |
| Engage a specialist | [Engage Cabinet Workflow](workflows/engage-cabinet.md) |
| Hand off between AI sessions | [Handoff Protocol](workflows/ai-handoff-protocol.md) |
| See current project state | [Master State Document](MASTER_STATE_DOCUMENT.md) |
| Understand governance rules | [Cabinet Constitution](AI_CABINET_CONSTITUTION.md) |

---

## 📁 Folder Structure

```
.agent/
├── README.md                    # This file - quick orientation
├── MASTER_STATE_DOCUMENT.md     # 🔴 LIVE STATE - Single source of truth
├── SPECIALIST_PROFILES.md       # Detailed role definitions
├── AI_CABINET_CONSTITUTION.md   # Governance rules & pipelines
├── AGENT_ARCHITECTURAL_PATTERNS.md # Knowledge base of agent patterns
├── UNIVERSAL_PROMPT.md          # Copy-paste prompts for any AI
├── workflows/
│   ├── engage-cabinet.md        # How to engage specialists
│   ├── ai-handoff-protocol.md   # Cross-session handoffs
│   └── launch_sovr_ecosystem.md # Ecosystem launch workflow
├── tasks/
│   └── TASK_TEMPLATE.md         # Template for new delegations
└── _archive/                    # Legacy/reference documents
```

---

## 🎯 The Cabinet

| # | Specialist | Role | Prime Directive |
|---|------------|------|-----------------|
| 0 | **Chief of Staff** | Strategist & Conductor | Orchestrate specialists with maximum efficiency |
| 1 | **Growth Hacker** | Virality Engineer | Maximize sustainable user growth |
| 2 | **Product Manager** | User Advocate | Define products users love |
| 3 | **FINTECH Architect** | Digital Alchemist | Build secure, scalable financial systems |
| 4 | **Code Quality Guardian** | Integrity Enforcer | Ensure highest code quality |
| 5 | **Creative Officer** | Aesthetic Architect | Create beautiful, intuitive experiences |
| 6 | **Brand Storyteller** | Narrative Weaver | Craft compelling narratives |
| 7 | **Financial Modeler** | Quantitative Strategist | Provide data-driven financial insights |
| 8 | **Legal Counsel** | Sentinel of Compliance | Protect from legal and regulatory risk |
| 9 | **The Articulator** | Semantic Architect | Transform complexity into clarity |

---

## 🔄 How It Works

```
┌─────────────────┐
│   Orchestrator  │  (Human Commander)
│  (You/User)     │
└────────┬────────┘
         │ Directive
         ▼
┌─────────────────┐
│ Chief of Staff  │  (Primary AI Coordinator)
│ (Antigravity)   │
└────────┬────────┘
         │ Delegates
         ▼
┌─────────────────────────────────────────────────┐
│              Specialist Pool                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │FINTECH │ │ Code   │ │Product │ │ Legal  │   │
│  │Architect│ │Quality │ │Manager │ │Counsel │   │
│  └────────┘ └────────┘ └────────┘ └────────┘   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │Creative│ │ Brand  │ │Finance │ │Articu- │   │
│  │Officer │ │Teller  │ │Modeler │ │lator   │   │
│  └────────┘ └────────┘ └────────┘ └────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Starting a Task

### Method 1: Direct Engagement (Same Session)
```
[SPECIALIST_NAME], [ACTION]: [REQUEST]
```
Example:
```
FINTECH Architect, DESIGN: API specification for TigerBeetle clearing integration
```

### Method 2: Cross-Session Handoff
1. Create task file in `tasks/`
2. Use template from [handoff protocol](workflows/ai-handoff-protocol.md)
3. Include MSD context
4. Paste Universal Specialist Prompt into target AI

### Method 3: Console (Coming Soon)
- Web-based Cabinet Console for visual task management
- Auto-generates prompts
- Tracks task status across sessions

---

## 📋 Current State

**Last Updated:** See [MASTER_STATE_DOCUMENT.md](MASTER_STATE_DOCUMENT.md)

**Active Project:** GM Family Trust - VAL Core

**Key Decisions:**
- TigerBeetle = Sole clearing authority (immutable)
- Clearing-first architecture
- No reversals - corrections as new obligations

---

## 🛡️ Governance

All operations governed by the [Cabinet Constitution](AI_CABINET_CONSTITUTION.md):

1. **Orchestrator** has ultimate authority
2. **Chief of Staff** coordinates all specialists
3. **Specialists** operate within defined boundaries
4. **Escalation** follows defined levels (1→2→3)
5. **All decisions** recorded in MSD

---

## 📚 Reference Documents

### Core Framework
- [SPECIALIST_PROFILES.md](SPECIALIST_PROFILES.md) - Full role definitions
- [AI_CABINET_CONSTITUTION.md](AI_CABINET_CONSTITUTION.md) - Governance & pipelines
- [AGENT_ARCHITECTURAL_PATTERNS.md](AGENT_ARCHITECTURAL_PATTERNS.md) - Knowledge base of agent patterns

### Operational
- [MASTER_STATE_DOCUMENT.md](MASTER_STATE_DOCUMENT.md) - Live project state
- [workflows/engage-cabinet.md](workflows/engage-cabinet.md) - Engagement templates
- [workflows/ai-handoff-protocol.md](workflows/ai-handoff-protocol.md) - Handoff protocol

---

*This framework enables multi-model AI coordination with persistent state across sessions.*
