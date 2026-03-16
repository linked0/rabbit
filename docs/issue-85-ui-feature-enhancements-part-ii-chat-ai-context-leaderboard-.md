# UI & Feature Enhancements Part II (Chat, AI Context, Leaderboard, Rewards)

**Issue #85** | **State:** OPEN | **Created:** 2026-01-23T04:31:35Z

**Labels:** enhancement

**Updated:** 2026-01-23T05:00:06Z | **Closed:** N/A

---

## Summary

Second phase UI improvements: in-market chat, AI-powered market context, related markets, leaderboard rankings, and rewards/achievements system.

## Tasks

- [ ] Implement real-time chat on market detail pages (WebSocket, moderation, position display)
- [ ] Build AI market context section (news aggregation, probability analysis, source citations)
- [ ] Add related markets recommendation section on detail page
- [ ] Implement leaderboard page (profit, win rate, volume rankings with time filters)
- [ ] Build rewards/achievements system (trading milestones, accuracy streaks, referrals)
- [ ] Design anti-gaming measures for leaderboard (min trade count, market diversity)

## References

- Leaderboard wireframe: `docs/task/images/leaderboard.png`
- Rewards wireframe: `docs/task/images/rewards.png`

## Notes

- Chat needs moderation investment (spam/profanity filters)
- AI Context ties into AI BOOST feature (#76)
- Leaderboard queries need DB optimization (materialized views)
- Allow users to opt out of leaderboard (privacy)

---

## Comments

### @linked0 — 2026-01-23T04:34:58Z

Reference UI for Reward and Leaderboard pages.

<img width="2744" height="1468" alt="Image" src="https://github.com/user-attachments/assets/65668130-e510-4018-b689-9a3778d66e74" />
<hr>
<img width="2202" height="1278" alt="Image" src="https://github.com/user-attachments/assets/4fcb69e1-3794-4b4d-b307-16ad01ec7c4b" />

---

