# Node.js Practice

## OVERVIEW

This document provides information about Node.js practice

## TARGET

- Understand and apply the knowledge learnt to build a practical API.
- Know how to design and implement API, including defining endpoints, handling HTTP methods (GET, POST, PUT, DELETE), request/response, and dealing with data validation and error handling.
- Know how to integrate databases with Node.js APIs like connecting to databases, performing CRUD (Create, Read, Update, Delete) operations.
- Understand the importance of API testing and achieve high code coverage in tests.
- Provide detailed documentation for API.

## TECH STACKS

- Backend: Node.js (TypeScript)
- Framework: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT
- Testing: Jest
- Documentation: Swagger

## REQUIREMENTS

Develop a RESTful backend API for a lightweight task management system (Trello-lite) that supports:

- Multi-user collaboration
- Task lifecycle management
- Role-based access control

### Functional Requirements

#### Authentication & Authorization

- User registration with username, email, and password
- Login with JWT
- Role-based access control
  - Admin: Full permissions
  - Member: Limited to assigned boards/tasks

#### Board Management

- Admin has full permission on boards:
  - Create board
  - Update board
  - Soft delete board
  - View boards
- Member can:
  - View boards they belong to

#### Board Membership & Invitations

- Admin can invite user to board with specified role
  - Notes: invitation will expire after 7 days

#### Task Management:

- Admin has full permission on tasks:
  - View tasks
  - Filter by assignee, status, and due date range
  - Pagination
  - Sorting: creation date
  - Create task
  - Update task
  - Soft delete task
  - Set due date
  - Change task status
  - Assign task to any user in board
- Any member in board can:
  - View tasks
  - Filter by assignee, status, and due date range
  - Pagination
  - Sorting: creation date
  - Create task
  - Update task
  - Set due date
  - Change task status only if they are the assignee
  - Assign task to other member in same board

## Q&A

### Authentication & Authorization

**Login with what — email or username?**

⇒ Assume: Log in with email + password.

**Answer:** Yes.

**What role is assigned to a user when they register?**

⇒ I assume users are assigned the Member role by default.

**Answer:** Yes.

### Board Management

**When someone creates a board, what information do they need to fill in?**

⇒ I assume a name and a description

**Answer:** Yes.

**What information is shown when viewing a board?**

⇒ I assume each board will display the board name and description

**Answer:** Yes.

**Which fields can be updated?**

⇒ I assume update name, description only

**Answer:** Yes.

**Q: Can users search or filter the list of boards?**

⇒ I assume users can search by name, results are paginated (20 boards per page), and sorted by creation date descending (newest first) by default.

**Answer:**

- The user can search boards by name.
- Display 10 boards by default
- Sort boards by creation date descending

**When a board is deleted, should it disappear permanently or just be hidden so it can be restored later?**

⇒ I assume the board is hidden (soft deleted), not permanently removed, so it can be restored if needed.

**Answer:** Just archive board (soft delete).

### Board Membership & Invitations

**How do we invite users to join a board?**

⇒ I assume users will be invited via email.

**Answer:** Yes.

**Do we have any preference for an email provider?**

**Answer:** No, could you recommend a suitable option?

⇒ Further research may be needed to determine the best fit, but I suggest using SendGrid as it has been used in previous team projects.

**When someone receives an invitation link and clicks it, what should happen if they don't have an account yet?**

⇒ I assume two cases

- Already has an account: redirected to the board
- No account yet: redirected to the sign-up page → after registering → redirected to the board

**Answer:** Yes, that's the correct flow.

**When the board is deleted, what should happen to invitations that haven't been accepted yet?**

⇒ I assume all pending invitations are automatically cancelled.

**Answer:** Yes, we should invalidate all pending invitations of archived boards.

**When an Admin invites someone to a board with a specified role, does that role apply once the user joins?**

**Answer:** Yes.

**What roles can be assigned when inviting someone to a board?**

⇒ I assume: the same as system roles — Admin or Member.

**Answer:** For now, only assign Member roles to invited users.

**Does the board role override the system role within that board?**

⇒ For example: a system-level Member is invited as a board Admin — can they perform Admin actions within that board?

**Answer:** Since we only allow inviting users to the board with Member roles (as confirmed above), this will not happen.

### Task Management

**When someone creates a task, what information do they need to fill in?**

⇒ I assume: a title (required). Optionally, they can also add a description, due date, assignee and status.

**Answer:** Yes.

**What information is shown when viewing a task?**

⇒ I assume each task displays its title, description, status, due date, and the name of the person it's assigned to.

**Answer:** Yes.

**Can users define their own task statuses, or should the system provide a fixed set?**

**Answer:** No, the user cannot customize or create new task status. The task status is predefined and fixed.

⇒ I assume the system provides a fixed set of statuses like To Do, In Progress, and Done. New tasks default to To Do.

**How are tasks sorted in the list — newest first or oldest first? And how many tasks appear per page?**

⇒ I assume the tasks are sorted by creation date descending (newest first) by default. Each page shows 20 tasks.

**Answer:** Yes.

**Are "Set due date", "Change task status", and "Assign task" separate actions, or are they all part of editing a task?**

⇒ I assume all is handled in a single Update task action.

**Answer:** Yes.

**When a task is deleted, should it be gone permanently or just hidden?**

⇒ I assume the tasks are hidden (soft deleted), not permanently removed.

**Answer:** Same as board, just archive (soft delete) tasks.
