# Trello Lite API Design

## OVERVIEW

This document provides an overview of the APIs supporting the Trello Lite task management system.

## API DESIGN PATTERNS

Base URL: `/api/v1`

### Headers

Required authentication

- Content-Type: application/json
- Authorization: Bearer XXXXX-XXXXX-XXXXX

### Metadata

```
{
   "total": int,
   "totalPages": int,
   "limit": int,
   "page": int,
}
```

Example use of metadata in list object results:

```json
{
   "meta": {
      "total": 100,
      "totalPages": 2,
      "limit": 100,
      "page": 1,
    },
   "data": [],
}
```

### Errors Response

```json
{
   "errors": {
        "code": "ERROR_CODE",
        "message": "Human-readable message",
    }
}
```

Example:

```json
{
   "errors": {
        "code": "VALIDATION_FAILED",
        "message": "The provided data is invalid."
    }
}
```

Field-Level Error Example:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The provided data is invalid.",
    "details": [
      {
        "field": "email",
        "description": "Email must be a valid address"
      }
    ]
  }
}
```

### Common errors

#### 400 Bad Request

```json
{
  "errors": {
     "code": "BAD_REQUEST",
     "message": "Invalid request syntax or missing field"
  }
}
```

#### 401 Unauthorized

```json
{
  "errors": {
     "code": "UNAUTHORIZED",
     "message": "Missing or invalid JWT token"
  }
}
```

#### 403 Forbidden

```json
{
  "errors": {
     "code": "FORBIDDEN",
     "message": "You do not have permission to perform this action"
  }
}
```

#### 404 Not Found

```json
{
  "errors": {
     "code": "NOT_FOUND",
     "message": "Resource not found"
  }
}
```

#### 409 Conflict

```json
{
  "errors": {
     "code": "CONFLICT",
     "message": "Resource already exists or conflict state."
  }
}
```

#### 500 Internal Server Error

```json
{
  "errors": {
     "code": "INTERNAL_SERVER_ERROR",
     "message": "Internal Server Error"
  }
}
```

## OBJECTS

### USERS

```
{
   "id": string,
   "username": string,
   "email": string,
   "role": "ADMIN" | "MEMBER",
   "createdAt": string,
   "updatedAt": string,
}
```

### BOARDS

```
{
   "id": string,
   "name": string,
   "description": string,
   "createdBy": string,
   "createdAt": string,
   "updatedAt": string,
   "deletedAt": string,
}
```

### TASKS

```
{
   "id": string,
   "boardId": string,
   "title": string,
   "description": string,
   "status": string,
   "dueDate": string,
   "assignee": User,
   "createdAt": string,
   "updatedAt": string,
   "deletedAt": string,
}
```

## GROUP CONSTANT VALUES

### User

User - role

- ADMIN = "Admin"
- MEMBER = "Member"

### Invitation

Invitation - status

- PENDING = "Pending"
- ACCEPTED = "Accepted"
- EXPIRED = "Expired"
- CANCELLED = "Cancelled"
- INACTIVE = “Inactive”

Invitation - role

- MEMBER = "Member"

### Task

Task - status

- TODO = "Todo"
- IN_PROGRESS = "In Progress"
- DONE = "Done"

## API ENDPOINTS

### AUTHENTICATION

#### `POST /auth/register` — Not Started

Register a new user account.

**Description of API**

Creates a new user with username, email, and password. The default role is MEMBER.

**Request**

```
{
   "username": string,
   "email": string,
   "password": string,
}
```

**Success Response**

Status Code: 201 Created

Response:

```
{
  "data": User,
  "access": "BearerTokenString",
}
```

**Error Response**

- Status Code: 400 Bad Request
- Status Code: 409 Conflict

#### `POST /auth/login` — Not Started

**Description of API**

Authenticates a user and returns access with the user

**Request**

```
{
   "email": string,
   "password": string
}
```

**Success Response**

Status Code: 200 OK

Response:

```
{
  "data": User,
  "access": "BearerTokenString",
}
```

**Error Response**

- Status Code: 401 Unauthorized

### BOARD MANAGEMENT

#### `GET /boards` — Not Started

**Description of API**

Get the list of boards. Admin gets all boards. Member gets only the boards they belong to.
Supports search by name, sorted by creation date descending.

**Query Support**

- `?search=project` — search by board name
- `?page=1&limit=10` — pagination (default: 10 per page)

**Request**

No request body required

**Success Response**

Status Code: 200 OK

Response:

```
{
   "meta": {
      "total": 100,
      "totalPages": 2,
      "limit": 100,
      "page": 1,
   },
   "data": [Board],
}
```

**Error Response**

- Status Code: 401 Unauthorized

#### `GET /boards/:id` — Not Started

**Description of API**

Return board details. Members can only access the boards they belong to

**Request**

No request body required

**Success Response**

Status Code: 200 OK

Response:

```
{
  data: Board
}
```

**Error Response**

- Status Code: 400 Bad Request
- Status Code: 403 Forbidden
- Status Code: 401 Unauthorized
- Status Code: 404 Not Found

#### `POST /boards` — Not Started

**Description of API**

Allows an Admin to create a new board.

**Request**

```json
{
  "name": "board 1",
  "description": "Sprint planning board"
}
```

**Success Response**

Status Code: 201 Created

Response:

```
{
  data: Board
}
```

**Error Response**

- Status Code: 403 Forbidden
- Status Code: 400 Bad Request
- Status Code: 409 Conflict

#### `PATCH /boards/:id` — Not Started

**Description of API**

Allows Admin to update name and/or description

**Request**

```json
{
  "name": "board 1",
  "description": "Sprint planning board"
}
```

**Success Response**

Status Code: 200 OK

Response:

```
{
  data: Board
}
```

**Error Response**

- Status Code: 403 Forbidden
- Status Code: 404 Not Found
- Status Code: 400 Bad Request
- Status Code: 409 Conflict

#### `DELETE /boards/:id` — Not Started

**Description of API**

Soft delete a board. Admin only.
Archives board by setting deleted_at = NOW(). All pending invitations are auto-cancelled.

**Request**

No request body required

**Success Response**

Status Code: 204 No Content

No response body.

**Error Response**

- Status Code: 403 Forbidden
- Status Code: 404 Not Found

### INVITATIONS

#### `POST /invitations` — Not Started

**Description of API**

Invite a user to the board by email. Admin only. Expires after 7 days.
Sends an invitation email. invited_by is auto-set to Admin's ID. Role is always MEMBER.

**Request**

```
{
  "email": "alice@example.com",
  "boardId": "string",
}
```

**Success Response**

Status Code: 204 No Content

No response body.

**Error Response**

- Status Code: 403 Forbidden
- Status Code: 409 Conflict

#### `GET /invitations/accept?token=` — Not Started

Accept a board invitation via token from the email link.

**Description of API**

Backend verifies token and invitation email:

- User has account → verify token → check status → accept → redirect to board
- User has no account → redirect to sign-up with token → after register → auto accept → redirect to board

**Query params**

| Parameter | Type   | Require | Description                          |
| --------- | ------ | ------- | ------------------------------------ |
| token     | string | yes     | Unique token from the invitation link |

**Success Response**

Status Code: 200 OK

User has an account. Response:

```json
{
  "data": {
    "boardId": "id_1"
  }
}
```

User has no account. Response:

```json
{
  "data": {
    "requiresRegistration": true,
    "email": "user@gmail.com",
    "boardId": "id_1"
  }
}
```

**Error Response**

- Status Code: 404 Not Found
- Status Code: 409 Conflict

### TASK MANAGEMENT

#### `GET /tasks` — Not Started

**Description of API**

Get a list of tasks in a board with filter, pagination, and sorting.

**Query Support**

- `?boardId` - filter by board id
- `?assigneeId=string` — filter by assignee
- `?status=TODO | IN_PROGRESS | DONE` — filter by status
- `?startDate=2024-01-01T00:00:00Z` — filter due date from
- `?endDate=2024-12-31T23:59:59Z` — filter due date to
- `?page=1&limit=20` — pagination (default: 20 per page)
- `?sortBy=createdAt&order=desc` — sorting (default: createdAt desc)

**Request**

No request body required

**Success Response**

Status Code: 200 OK

Response:

```
{
  "meta": {
     "total": 100,
      "totalPages": 2,
      "limit": 100,
      "page": 1,
  },
  "data": [Task]
}
```

**Error Response**

- Status Code: 403 Forbidden

#### `POST /tasks` — Not Started

**Description of API**

Create a new task. Any board member can create tasks.

**Request**

```json
{
  "boardId": "string",
  "title": "Fix login bug",
  "description": "Investigate session expiry issue",
  "assigneeId": "string",
  "status": "string",
  "dueDate": "2024-06-30T00:00:00Z"
}
```

**Succes Response**

Status Code: 201 Created

Response:

```
{
  "data": Task
}
```

**Error Response**

- Status Code: 400 Bad Request

#### `GET /tasks/:taskId` — Not Started

**Description of API**

Get the details of a specific task.

**Request**

No request body required

**Success Response**

Status Code: 200 OK

Response:

```
{
  "data": Task
}
```

**Error Response**

- Status Code: 404 Not Found

#### `PATCH /tasks/:taskId` — Not Started

**Description of API**

Update a task. Any board member can update

Updates task fields:

- title, description, dueDate — any board member can update freely
- status — Member can only update if their id matches assigneeId
- assigneeId — Member can only assign to other board members

**Request**

```json
{
  "title": "Fix login bug - Updated",
  "description": "Root cause found",
  "status": "IN_PROGRESS",
  "assigneeId": "string",
  "dueDate": "2024-07-15T00:00:00Z"
}
```

**Success Response**

Status Code: 200 OK

Response:

```
{
  "data": Task
}
```

**Error Response**

- Status Code: 403 Forbidden
- Status Code: 404 Not Found

#### `DELETE /tasks/:id` — Not Started

**Description of API**

Soft delete a task. Admin only.
Archives task by setting deleted_at = NOW(). The task is excluded from all queries after deletion.

**Request**

No request body required

**Success Response**

Status Code: 204 No Content

No response body.

**Error Response**

- Status Code: 403 Forbidden
- Status Code: 404 Not Found
