# Attendee Dock V1 — Wireframes

Visual dev preview: run the web app locally and open `/dev/attendee-dock` (dev only).

## Modes

| Mode | Stage | Dock | Notes |
|------|-------|------|-------|
| Right Dock | Speaker or grid (Jitsi) | Vertical strip, right edge | Default; collapse to toolbar-only |
| Top Dock | Speaker or grid | Horizontal strip, top | User preference |
| Hidden Dock | Full width | Restore chip “Attendees” | No dock chrome |
| Speaker View | Large active / pinned speaker | Thumbnails in dock | Double-tap tile to pin |
| Grid View | Equal tiles | Dock optional (collapsed common) | Jitsi tile view |
| Floating Self | Unchanged stage | User dock pref | Draggable “You” window; Jitsi self hidden |
| Webinar | Presenter on stage | Audience only in dock | `RoomMode.WEBINAR` filters roster |
| Screen Share | Shared content on stage | Effective top dock | Overrides right unless hidden |

## Preference keys (`bold:attendee-layout-prefs`, v2)

- `dockPosition`: `right` \| `top` \| `hidden`
- `dockCollapsed`, `dockViewMode`, `stageLayout`
- `selfViewMode`, `selfViewCorner`, `selfViewFloating`
- Display toggles: names, active speaker ring, auto-hide controls

Migrates from legacy `bold:meeting-layout-prefs` on first read.

## Component map

- `useAttendeeLayout` — prefs + effective layout + Jitsi apply
- `useDockRoster` — webinar audience filter + dock view mode
- `AttendeeDock` — shell, toolbar, thumbnail strip
- `SelfViewOverlay` — floating self preview
- `MeetingLayoutSettings` — full settings panel
