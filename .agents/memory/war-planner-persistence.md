---
name: War planner persistence
description: Durable rules for keeping manual war planning state separate from live Clash API data.
---

War planner assignments are planner-owned state keyed by a stable war key and attacker tag; live Clash API snapshots remain read-only and authoritative for member/attack facts.

**Why:** Live war data can refresh or lag independently of manual target decisions, so mixing the two would overwrite plans or make a completed assignment disappear during a refresh.

**How to apply:** Store only target map position and planner statuses (locked/completed) in the application database, scope reads and writes to the current war key, and invalidate planner queries after mutations.