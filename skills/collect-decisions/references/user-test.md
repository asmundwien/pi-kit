# Collect Decisions Skill User Test

## Purpose

Use this in a fresh pi session to verify that the `collect-decisions` skill changes agent behavior semantically: when the agent would otherwise present a list of user decisions, it should invoke `collect_decisions` and return an iteration-ready report based on the user's choices.

## Setup

From this repository checkout, start pi with the local package installed or loaded:

```bash
pi install /Users/asmund.wien/source/swarm/pi-kit
```

Then start a new interactive pi session. If you do not want to install the package globally, start pi with the local extension/package path your workflow normally uses.

## Test prompt

Paste this as the first user message in the fresh session:

```text
I want you to plan a small change, but don't implement it yet. The change is: add a command that opens the current repository in my editor.

Before planning, you need my choices on several things: command name, whether it should support extra arguments, whether documentation is in scope, and how strict error handling should be. Use whatever interaction pattern your instructions recommend. After I answer, produce a concise "Collect Decisions Skill Test Result" with:

- whether you used the collect_decisions tool
- the decisions I made, preserving their labels/ids if available
- any pending or paused decisions
- whether the behavior avoided a wall-of-questions in chat
- one sentence on what should be improved in the skill or tool
```

## How to answer during the test

Choose any options you like. To test pause/resume, press `Esc` during one topic and first give discussion feedback that is not an answer to the pending decision. The agent should discuss or acknowledge that feedback and wait for an explicit continue signal before reopening the collector. In a second run or later paused topic, give an explicit conversational answer outside the collector; the agent should record that answer for the paused decision before resuming. Then ask the agent to continue collecting the remaining decisions.

## Expected semantic result

The final assistant response should contain a section titled `Collect Decisions Skill Test Result` and should report, from the session's actual behavior:

- `collect_decisions` was used when two or more human decisions were needed
- each selected answer is summarized
- no pending decisions remain unless you intentionally paused and stopped
- the agent did not present the initial choices as a plain wall of chat questions
- after a pause, the agent waited for an explicit continue signal before reopening the collector
- pause-discussion feedback was not misclassified as the answer to the pending decision
- explicit conversational answers during pause were recorded as answers before resuming
- at least one improvement observation is recorded for future iteration

If the tool is unavailable, the report should say so explicitly and should not claim the interactive tool was used.
