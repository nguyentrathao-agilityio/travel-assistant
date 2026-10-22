# TL-007: Board invitations

- **Status:** Draft
- **Requirements:** FR-INV-01 … 08, DES-INV-01 … 03, D-06, D-07, D-19
- **Blocking questions:** Q-18 (is accept authenticated? email match), Q-19 (how register receives the token), Q-20 (codes for expired/cancelled/accepted), Q-34 (what causes 409), Q-07 (edge cases)
- **Assumptions relied on:** A-002 (email provider — not acknowledged)
- **Owner:** _TBD_
- **Depends on:** TL-006

## Goal

Admins invite users to a board by email with the Member role; invitees
accept through a link, with or without an existing account; invitations
expire after 7 days and are cancelled when their board is archived.

## Scope

**In scope**

- `Invitation` model + migration; `InvitationStatus` enum (D-06).
- `POST /invitations`, `GET /invitations/accept?token=`.
- Email sending behind an interface; fake implementation in tests.
- Register flow completing a pending invitation (mechanism per Q-19).
- Board archive (TL-006) sets pending invitations to `CANCELLED` (D-07).

**Out of scope**

- Revoking or re-sending invitations (Q-07).
- Choosing the production email provider (A-002) beyond the interface.

## Acceptance criteria

- [ ] AC-INV-01 … AC-INV-08 (`docs/requirements.md` §4.5) pass.
- [ ] An accepted token cannot be used again.

## API changes

| Method | Route                                 | Auth           | Request               | Response / status codes |
| ------ | ------------------------------------- | -------------- | --------------------- | ----------------------- |
| POST   | `/api/v1/invitations`                 | Admin          | `{ email, boardId }`  | 204; 403; 409 |
| GET    | `/api/v1/invitations/accept?token=`   | Per Q-18       | —                     | 200 `{ data: { boardId } }` or `{ data: { requiresRegistration, email, boardId } }`; 404; 409 |

## Data / schema changes

`invitations` per DB design (statuses per D-06) and `docs/architecture.md` §3.2.1.
**Requires approval.**

## Assumptions

- A-002: SendGrid — must be acknowledged before wiring a real provider.

## Security considerations

- Tokens are random and single-use; only their SHA-256 hash is stored (D-19).
- Accepting must not let a different user join on someone else's invitation (Q-18).
- Never log tokens.

## Test plan

- **Unit:** expiry calculation; status transitions; archive cancels pending.
- **E2E:** invite (Admin vs Member); accept with/without account; expired;
  unknown token; archived board.

## Workflow checklist

- [ ] Read: requirements, questions, architecture, affected code
- [ ] Plan: written and approved (schema, email dependency)
- [ ] Test: tests written and failing for the right reason
- [ ] Implement
- [ ] Verify: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` pass
- [ ] Review: diff self-reviewed; docs and ticket status updated

## Notes

_TBD_
