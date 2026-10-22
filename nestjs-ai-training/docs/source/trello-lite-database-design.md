# Trello Lite Database Design

## OVERVIEW

This document provides an overview of the Database design of the Trello Lite task management system.

## DATABASE DESIGN

### DIAGRAM

Link

### TABLES

#### Users

Stores all user accounts. The role is a system-wide role that applies across the entire system.

| Field     | Type     | Constraint       | Description                 |
| --------- | -------- | ---------------- | --------------------------- |
| id        | string   | PK               | Primary key, auto-generated |
| username  | string   | UNIQUE, NOT NULL | Unique username             |
| email     | string   | UNIQUE, NOT NULL | Unique email address        |
| password  | string   | NOT NULL         | Bcrypt hashed password      |
| role      | string   | NOT NULL         | System role: ADMIN \| MEMBER |
| createdAt | datetime | NOT NULL         | Account creation time       |
| updatedAt | datetime | NOT NULL         | Last updated time           |

#### boards

Top-level workspaces containing tasks

| Field       | Type     | Constraint  | Description                  |
| ----------- | -------- | ----------- | ---------------------------- |
| id          | string   | PK          | Primary key, auto-generated  |
| name        | string   | NOT NULL    | Board display name           |
| description | string   | NULL        | Optional board description   |
| created_by  | string   | FK → users  | Admin who created this board |
| deletedAt   | datetime | NULL        | Timing for soft delete board |
| createdAt   | datetime | NOT NULL    | Board creation time          |
| updatedAt   | datetime | NOT NULL    | Last updated time            |

#### board_members

Junction table between users and boards. Stores that users belong to, which boards.

| Field   | Type   | Constraint  | Description                 |
| ------- | ------ | ----------- | --------------------------- |
| id      | string | PK          | Primary key, auto-generated |
| boardId | string | FK → boards | Reference to the board      |
| userId  | string | FK → users  | Reference to the user       |

#### invitations

Stores board invitation records sent to users via email

| Field     | Type     | Constraint  | Description                                                      |
| --------- | -------- | ----------- | ---------------------------------------------------------------- |
| id        | string   | PK          | Primary key, auto-generated                                      |
| boardId   | string   | FK → boards | The board is being invited to                                    |
| email     | string   | NOT NULL    | Email the user receiving the invitation                          |
| invitedBy | string   | FK → users  | Admin who sent the invitation                                    |
| role      | string   | NOT NULL    | Role to assign on acceptance: MEMBER                             |
| status    | string   | NOT NULL    | PENDING \| ACCEPT \| EXPIRED \| CANCCELD \| INACTIVE             |
| token     | string   | NOT NULL    | Unique token used to generate the invitation link sent via email |
| createdAt | datetime | NOT NULL    | Invitation creation time                                         |
| updatedAt | datetime | NOT NULL    | Last updated time                                                |

#### tasks

Core entity storing individual tasks within a board

| Field       | Type     | Constraint       | Description                                            |
| ----------- | -------- | ---------------- | ------------------------------------------------------ |
| id          | string   | PK               | Primary key, auto-generated                            |
| boardId     | string   | FK → boards      | Reference to the board                                 |
| assigneeId  | string   | FK → users, NULL | A task can exist without being assigned                |
| createdBy   | string   | FK → users       | The user who created the task                          |
| title       | string   | NOT NULL         | Task title, required                                   |
| description | string   | NULL             | Optional task description                              |
| status      | string   | NOT NULL         | Fixed by system: TODO, IN_PROGRESS, DONE. Default TODO |
| dueDate     | string   | NULL             | Optional deadline                                      |
| deletedAt   | datetime | NULL             | Timing for soft delete task                            |
| createdAt   | datetime | NOT NULL         | Task creation time                                     |
| updatedAt   | datetime | NOT NULL         | Last updated time                                      |
