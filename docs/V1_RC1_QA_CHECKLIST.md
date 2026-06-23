# Bold V1 — Release Candidate 1 QA Checklist

**Branch:** `release/v1-rc1`  
**Scope:** Manual release-candidate validation only. No new features. Fix reported issues only.

**Tester:** ___________________  
**Date:** ___________________  
**Environment:** ___________________ (e.g. staging URL, browsers, devices)

**Instructions**

1. Test each section in order when possible (meeting flows build on each other).
2. Mark **Pass** or **Fail** for each item.
3. Record repro steps, screenshots, and console errors in **Notes**.
4. Do not file feature requests during this freeze — only defects against expected results below.

---

## 1. Two participant meeting

| | |
|---|---|
| **Pass** | [ ] |
| **Fail** | [ ] |

**Steps**

1. Host creates a meeting and joins from desktop browser.
2. Second participant joins (signed-in user or guest) from a separate browser/profile.
3. Both enable camera and microphone.
4. Observe the meeting stage for 2–3 minutes (speak, mute/unmute, toggle video).

**Expected result**

- Each participant appears once on stage (no duplicate tiles for the same person).
- No Bold overlay participant strip (no RP/SA initials dock).
- No duplicate self-view (floating PIP of self on top of main stage).
- No Layout button, layout menu, or layout settings anywhere in the meeting UI.
- Participant videos render naturally via Jitsi (automatic layout only).
- Controls bar visible and usable for both participants.

**Notes**

```
```

---

## 2. Screen share

| | |
|---|---|
| **Pass** | [ ] |
| **Fail** | [ ] |

**Steps**

1. In the same two-participant meeting, host (or either participant with share permission) starts screen share.
2. Share a browser tab or window with clearly identifiable content.
3. Observer confirms what the non-sharing participant sees.
4. Stop screen share and confirm layout returns to normal.

**Expected result**

- Shared content dominates the stage (large, primary view).
- Participant camera tiles do not cover or obscure shared content.
- No duplicate stage PIP of the same shared content.
- Filmstrip/thumbnails remain secondary (do not block content).
- Stopping share restores normal two-participant layout without duplicate tiles.

**Notes**

```
```

---

## 3. Webinar

| | |
|---|---|
| **Pass** | [ ] |
| **Fail** | [ ] |

**Steps**

1. Host switches room to **Webinar** mode (requires plan permission).
2. Host joins; at least one attendee joins (not on stage).
3. Host uses **Invite to stage** from Participants panel for one attendee.
4. Host uses **Remove from stage** for that attendee.
5. Confirm no “Promote to panelist” or Panelist role appears anywhere.

**Expected result**

- Presenter/host is visually dominant on stage.
- Off-stage attendees are minimized (not equal tiles with presenter).
- **Invite to stage** and **Remove from stage** work in webinar only.
- Panelist role is not offered in UI; only Host, Co-host, Participant labels shown.
- Stage invite/remove updates for all participants without refresh.

**Notes**

```
```

---

## 4. Mobile browser

| | |
|---|---|
| **Pass** | [ ] |
| **Fail** | [ ] |

**Steps**

1. Join a meeting from a mobile browser (iOS Safari and/or Android Chrome).
2. Open Chat and Participants panels.
3. Use mute, video, leave, and (if permitted) screen share.
4. Rotate device if applicable.

**Expected result**

- Meeting controls remain visible (no permanent auto-hide on mobile).
- Chat/Participants panels do not overlap controls or hide Leave/end buttons.
- No panels clipped off-screen or trapped behind other layers.
- Touch targets on controls are reachable.
- Layout does not show duplicate self-view or Bold overlay strip.

**Notes**

```
Device / OS / browser:


```

---

## 5. Host transfer

| | |
|---|---|
| **Pass** | [ ] |
| **Fail** | [ ] |

**Steps**

1. Three signed-in users in a meeting: original host (A), participant B, participant C.
2. Host A opens Participants → **Make host** on B.
3. Confirm B sees host-only controls (end meeting, lock, waiting room, etc.).
4. Confirm A no longer has host-only controls.
5. Optional: B transfers host to C and repeat observation.

**Expected result**

- **Make host** succeeds without page reload.
- New host’s UI updates immediately (host menu options, end meeting, etc.).
- Previous host becomes Participant (or loses host-only actions immediately).
- Participant list shows correct Host badge on new host only.
- Meeting continues without disconnect for other participants.

**Notes**

```
```

---

## 6. Co-host

| | |
|---|---|
| **Pass** | [ ] |
| **Fail** | [ ] |

**Steps**

1. Host opens Participants → **Make co-host** on a signed-in participant.
2. Co-host verifies moderator actions (mute others, participants panel, mute all if shown).
3. Host opens Participants → **Remove co-host** on that user.
4. Former co-host verifies moderator actions are revoked.

**Expected result**

- **Make co-host** and **Remove co-host** succeed without reload.
- Co-host gains moderator permissions immediately (participants actions, etc.).
- Remove co-host revokes permissions immediately.
- Free-plan users see upgrade prompt when attempting co-host (if applicable); Pro/Enterprise/Super Admin do not hit false paywall.

**Notes**

```
```

---

## 7. YouTube Live

| | |
|---|---|
| **Pass** | [ ] |
| **Fail** | [ ] |

**Steps**

1. As host (Pro+ or Enterprise/Super Admin), open **Go Live** / YouTube Live modal.
2. Confirm modal fields only.
3. Select YouTube account and visibility (Public / Unlisted / Private).
4. Start live stream; verify YouTube receives video.
5. Compare YouTube stream to what meeting attendees see (same meeting tab view).

**Expected result**

- Modal shows **only**: YouTube Account, Visibility (Public / Unlisted / Private), Go Live.
- Modal does **not** show: Stream Source, Camera & microphone, Share screen/window/tab, or any capture-mode picker.
- Bold automatically captures what attendees see (meeting tab).
- Stream starts without user selecting capture mode.
- Stop live ends stream cleanly.

**Notes**

```
YouTube account used:


```

---

## 8. Super Admin billing

| | |
|---|---|
| **Pass** | [ ] |
| **Fail** | [ ] |

**Steps**

1. Sign in as **Super Admin**.
2. Visit sidebar, **Billing** page, **Settings → Billing**, meeting room (Go Live), Recordings, Integrations.
2. Sign in as **Enterprise** user (non–Super Admin) and repeat billing surfaces.
3. Sign in as **Free** user and confirm upgrade CTAs still appear where expected.

**Expected result**

- Super Admin never sees **Upgrade to Pro** or paywall modals for Pro features (co-host, YouTube Live, webinar mode, etc.).
- Super Admin billing page shows correct plan (Enterprise or effective premium plan).
- Enterprise user does not see upgrade CTA on billing page or sidebar upgrade banner.
- Enterprise has Pro-tier permissions (co-host, YouTube Live, room mode switch).
- Free user still sees appropriate upgrade prompts (regression check).

**Notes**

```
Super Admin email:


Enterprise test account:


```

---

## Sign-off

| Role | Name | Date | RC1 ready for production? |
|------|------|------|---------------------------|
| QA | | | [ ] Yes  [ ] No — blockers below |
| Engineering | | | |
| Product | | | |

**Blockers (must be empty for production merge)**

```
```

**Post-QA rule:** Fix only failures documented above. No new functionality until QA sign-off.
