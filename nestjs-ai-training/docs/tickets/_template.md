# TL-XXX: <Title>

- **Status:** Draft
- **Requirements:** FR-XXX-XX, NFR-XX
- **Blocking questions:** Q-XX (or "none")
- **Assumptions relied on:** A-XXX (or "none")
- **Owner:** _TBD_

## Goal

_What this ticket delivers and why, in one or two sentences._

## Scope

**In scope**

- _TBD_

**Out of scope**

- _TBD_

## Acceptance criteria

- [ ] _Given … when … then …_
- [ ] _TBD_

## API changes

| Method | Route | Auth | Request | Response / status codes |
| ------ | ----- | ---- | ------- | ----------------------- |
| _TBD_  |       |      |         |                         |

## Data / schema changes

_None, or describe. Schema changes require approval._

## Assumptions

_List any assumption made; each must be acknowledged before implementation._

## Security considerations

- Authentication: _TBD_
- Authorization (who may access which resources): _TBD_
- Input validation: _TBD_
- Sensitive data in responses/logs: _TBD_

## Test plan

- **Unit:** _TBD_
- **E2E:** happy path, validation errors (400), unauthenticated (401),
  unauthorized access to others' resources, not found (404), _TBD_

## Workflow checklist

- [ ] Read: requirements, questions, architecture, affected code
- [ ] Plan: written and (if major) approved
- [ ] Test: tests written and failing for the right reason
- [ ] Implement
- [ ] Verify: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` pass
- [ ] Review: diff self-reviewed; docs and ticket status updated

## Notes

_TBD_
