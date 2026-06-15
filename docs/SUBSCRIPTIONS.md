# Bold — Subscription & Permissions Architecture

## Overview

Feature access is controlled by **subscription plans**, not hardcoded checks. Business logic calls `PermissionsService.check(userId, permission)` or uses `@RequirePermission()` on API routes.

## Plans

| Feature | FREE | STARTER | PRO | BUSINESS | ENTERPRISE |
|---------|------|---------|-----|----------|------------|
| Meeting duration | 60 min (+ grace) | 120 min | Unlimited | Unlimited | Unlimited |
| Meeting attendees | 100 | 100 | 250 | 500 | 5000 |
| Webinar attendees | 100 | 250 | 500 | 1000 | 5000 |
| Co-hosts | 1 | 2 | 5 | 10 | 20 |
| Panelists | 3 | 5 | 10 | 20 | 50 |
| Meeting + Webinar modes | ✓ | ✓ | ✓ | ✓ | ✓ |
| YouTube streaming | ✗ | ✗ | ✓ | ✓ | ✓ |
| Evergreen webinar | ✗ | ✗ | ✓ | ✓ | ✓ |
| Assign moderator | ✗ | ✗ | ✓ | ✓ | ✓ |

## Permission keys

```typescript
type PermissionKey =
  | 'canStreamToYoutube'
  | 'canUseCohost'
  | 'canRecord'
  | 'canInvite'
  | 'canHostMeeting'
  | 'canUseWaitingRoom'
  | 'canUseChat'
  | 'canUseRaiseHand'
  | 'canUseReactions'
  | 'canUsePanelists'
  | 'canSwitchRoomMode'
  | 'canUseEvergreenWebinar'
  | 'canAssignModerator';
```

## Limit keys

```typescript
meetingAttendeeLimit
webinarAttendeeLimit
maxMeetingDurationMinutes
maxCohosts
maxPanelists
gracePeriodMinutes
```

## Adding a new plan

1. Add enum value to `SubscriptionPlan` in Prisma + shared package
2. Add entry to `PLAN_DEFINITIONS` in `packages/shared/src/subscriptions/plans.ts`
3. No other code changes required if using permission keys

## API usage

```typescript
@RequirePermission('canStreamToYoutube')
@UseGuards(AuthGuard, PermissionsGuard)
```

## Frontend usage

```typescript
const { can, limits, plan } = usePermissions();
if (!can('canStreamToYoutube')) { ... }
```

## Meeting duration enforcement

- Free plan: 60-minute limit + 5-minute grace period
- Polled every 30s via `GET /api/meetings/:id/duration`
- On expiry: meeting ended gracefully + modal shown to participants

## Database

- `users.subscriptionPlan` — `FREE | PRO | ENTERPRISE`
- `users.subscriptionExpiresAt` — optional; falls back to FREE when expired
