# BoldMeet — Component Plan

## UI Design System

### Theme
- Primary: `#2563EB` (blue-600)
- Dark mode: `#0F172A` background, `#1E293B` surfaces
- Light mode: `#FFFFFF` background, `#F8FAFC` surfaces
- Accent: `#10B981` (green for live indicator)
- Error: `#EF4444`, Warning: `#F59E0B`

### Typography
- Font: Inter (via next/font)
- Headings: font-semibold
- Body: font-normal, text-sm/base

---

## Base UI Components (`components/ui/`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `Button` | variant, size, loading, disabled | Primary actions |
| `Input` | label, error, type | Form fields |
| `Modal` | open, onClose, title | Dialogs |
| `Avatar` | src, name, size | User avatars |
| `Badge` | variant, children | Status labels (Live, Host) |
| `Toggle` | checked, onChange, label | Feature toggles |
| `Dropdown` | items, trigger | Action menus |
| `Tooltip` | content, children | Hover hints |
| `Tabs` | tabs, activeTab | Panel navigation |
| `Spinner` | size | Loading states |
| `EmptyState` | icon, title, action | No data views |

---

## Layout Components (`components/layout/`)

| Component | Purpose |
|-----------|---------|
| `AppShell` | Dashboard layout with sidebar |
| `Header` | Top nav with user menu, theme toggle |
| `Sidebar` | Dashboard navigation links |
| `AuthLayout` | Centered card for login/signup |
| `MeetingLayout` | Full-viewport meeting container |

---

## Meeting Components (`components/meeting/`)

### Core

| Component | Description |
|-----------|-------------|
| `JitsiContainer` | Embeds Jitsi External API, handles room lifecycle |
| `ControlsBar` | Sticky bottom bar: mic, cam, share, chat, participants, reactions, hand, fullscreen, leave |
| `FullscreenWrapper` | Browser Fullscreen API wrapper with exit button + ESC support |

### Panels (slide-in from right)

| Component | Description |
|-----------|-------------|
| `ParticipantsPanel` | Attendee list with role badges, mic/video status, host controls |
| `ChatPanel` | Message list, input, unread badge, host-only mode indicator |
| `MeetingSettingsPanel` | Host-only feature toggles during meeting |

### Interactive

| Component | Description |
|-----------|-------------|
| `ReactionsOverlay` | Floating emoji animations (temporary, fade out) |
| `RaiseHandQueue` | Host view of raised hands with acknowledge/allow/ignore |
| `WaitingRoomPanel` | Host view: admit/reject/admit-all waiting participants |
| `WaitingRoomScreen` | Participant view while waiting for admission |
| `LobbyScreen` | Pre-join: name input, device preview, join button |

### Streaming

| Component | Description |
|-----------|-------------|
| `YouTubeStreamControls` | Start/stop stream, visibility selector |
| `StreamStatusBanner` | Live indicator when streaming to YouTube |

---

## Dashboard Components (`components/dashboard/`)

| Component | Description |
|-----------|-------------|
| `MeetingCard` | Single meeting with status, time, join/start buttons |
| `MeetingList` | Filtered list (upcoming, live, past) |
| `QuickActions` | Instant meeting, schedule, join by code |
| `MeetingAnalytics` | Basic stats: duration, participants count |
| `CreateMeetingForm` | Title, schedule, password, settings toggles |

---

## Auth Components (`components/auth/`)

| Component | Description |
|-----------|-------------|
| `LoginForm` | Email/password + Google OAuth button |
| `SignupForm` | Name, email, password + Google OAuth |
| `GoogleButton` | Reusable Google sign-in button |
| `ProtectedRoute` | HOC/wrapper redirecting unauthenticated users |

---

## State Management (Zustand Stores)

### `meetingStore`
```typescript
{
  meetingId, title, status, settings,
  participants: Participant[],
  localParticipant: Participant,
  chatMessages: ChatMessage[],
  raisedHands: Participant[],
  waitingRoom: Participant[],
  activePanel: 'chat' | 'participants' | 'settings' | null,
  isFullscreen: boolean,
  unreadChatCount: number,
  // actions
  setSettings, addParticipant, updateParticipant,
  addChatMessage, togglePanel, setFullscreen
}
```

### `uiStore`
```typescript
{
  theme: 'light' | 'dark',
  sidebarOpen: boolean,
  // actions
  toggleTheme, toggleSidebar
}
```

### `authStore`
```typescript
{
  user: User | null,
  isLoading: boolean,
  // actions
  setUser, clearUser
}
```

---

## Page Component Tree

```
/meeting/[id]/room
└── MeetingLayout
    ├── FullscreenWrapper
    │   ├── JitsiContainer
    │   ├── ReactionsOverlay
    │   └── ControlsBar
    │       ├── MicButton
    │       ├── CameraButton
    │       ├── ShareButton
    │       ├── ChatToggle → ChatPanel
    │       ├── ParticipantsToggle → ParticipantsPanel
    │       ├── ReactionsPicker
    │       ├── RaiseHandButton
    │       ├── FullscreenButton
    │       └── LeaveButton
    ├── ParticipantsPanel (conditional)
    ├── ChatPanel (conditional)
    ├── RaiseHandQueue (host only)
    ├── WaitingRoomPanel (host only)
    └── StreamStatusBanner (conditional)
```

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< 640px` | Single column, panels as full-screen overlays |
| `640–1024px` | Compact controls bar, smaller panels |
| `> 1024px` | Full layout with side panels |

---

## Accessibility

- All controls keyboard-navigable
- ARIA labels on icon-only buttons
- Focus trap in modals/panels
- Screen reader announcements for raise hand, reactions
- Color contrast WCAG AA compliant
