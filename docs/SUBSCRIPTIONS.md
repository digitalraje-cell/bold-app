# Bold — Subscription & Permissions Architecture

## Overview

Feature access is controlled by **subscription plans**, not hardcoded checks. Business logic calls `PermissionsService.check(userId, permission)` or uses `@RequirePermission()` on API routes.

## Plans

| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Meeting duration | 60 min (+ 5 min grace) | Unlimited | Unlimited |
| Attendee limit | 100 | 500 | 5000 |
| Co-hosts | 1 | 5 | 20 |
| YouTube streaming | ✗ | ✓ | ✓ |
| Recording | ✗ | ✓ | ✓ |
| Chat / reactions / raise hand / waiting room / invite | ✓ | ✓ | ✓ |

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
  | 'canUseReactions';
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
