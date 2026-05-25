# Stonebridge AI Voice Agent Demo Runbook

Purpose: show the internal Stonebridge AI lead workflow without exposing real lead data or enabling outbound actions.

## Demo story

A field-services company submits an AI integration readiness form. Volt reviews the intake, summarizes fit and risk, stages a follow-up email, and creates an internal follow-up task for Kris approval.

## Safety boundary

This demo uses sanitized fixture data from `demo/sanitized-lead.txt`.

The workflow does not send email, create calendar invites, write to CRM, or contact anyone externally. Drafts and tasks are internal only until Kris explicitly approves a later action.

## Prerequisites

From the repo root:

```bash
cd /home/openclaw/.openclaw/workspace/stonebridge-ai-landing
```

No AgentMail credentials are required for the fixture-based demo.

## Demo commands

### 1. Summarize the sanitized lead

```bash
npm run lead:summary -- --file demo/sanitized-lead.txt
```

Expected talking points:

- Company and contact are extracted from the intake.
- Workflow, tools, bottlenecks, sensitive-data boundaries, budget, and timeline are normalized.
- Fit should be `high` and urgency should be `medium`.
- The recommended next action should focus on discovery and scoping a pilot.

### 2. Stage the follow-up draft

```bash
npm run lead:draft -- --file demo/sanitized-lead.txt
```

Expected talking points:

- The draft is generated from structured summary fields.
- It is explicitly marked staged only.
- `Send action: disabled` is shown.
- The draft asks scoped discovery questions instead of promising implementation.

### 3. Create the internal follow-up task

Use a temp queue for demos so no real task queue is modified:

```bash
npm run lead:task -- --file demo/sanitized-lead.txt --task-file tmp/demo-lead-followups.jsonl
```

Expected talking points:

- The task includes lead context, due date, priority, next action, missing information, and draft metadata.
- External action remains disabled.
- Approval is required before any send/calendar/CRM/Discord action.
- Re-running the command is idempotent and reports the same task as already queued.


### 5. Review open internal follow-up tasks

```bash
npm run lead:tasks -- --task-file tmp/demo-lead-followups.jsonl
```

Expected talking points:

- Open tasks are sorted by status, due date, and priority.
- Overdue tasks are flagged.
- The list shows the next action and confirms external action is disabled.

### 6. Mark a demo task handled

Use the task id shown by `lead:task` or `lead:tasks`:

```bash
npm run lead:tasks -- --task-file tmp/demo-lead-followups.jsonl --mark-handled lead-4cf5f0e38dbd --handled-note "Handled in demo only."
```

Expected talking point: marking handled updates only the local queue. It does not send email, create calendar events, or touch CRM.

### 7. Optional live inbox proof

Only if Kris wants to show the live integration path:

```bash
set -a; . ../.env; set +a
npm run lead:summary
```

Expected talking point: live AgentMail access is read-only for this workflow.

## Suggested voice narration

"This is the Stonebridge AI intake agent. A prospect submits the form, the system reads the lead, extracts the workflow and operational bottleneck, scores fit and urgency, stages a safe follow-up draft, and creates an internal follow-up task. Nothing is sent externally until I approve it."

## Demo value proposition

- Reduces response latency for inbound leads.
- Creates consistent lead qualification output.
- Preserves human approval for outbound communication.
- Produces a reusable client-facing pattern: intake, triage, draft, task handoff, approval.

## Cleanup

If you used the temp queue:

```bash
rm -f tmp/demo-lead-followups.jsonl
rmdir tmp 2>/dev/null || true
```

Do not delete `tasks/lead-followups.jsonl` unless Kris explicitly asks.
