# SubsFlow Admin Panel - Phase 1

You are a senior full-stack engineer working on an existing project called **SubsFlow**.

SubsFlow is a **multi-tenant SaaS subscription management platform**.

We are building the system incrementally. For this task, implement **ONLY the SubsFlow Platform Admin side**.

Do NOT implement the Tenant Owner, Tenant Admin, or Tenant Developer dashboards yet.

## Core Architecture

The platform has this hierarchy:

```text
                         SUBSFLOW
                            │
              ┌─────────────┴─────────────┐
              │                           │
        SUBSFLOW TEAM                 TENANTS
          (Us)                         (SaaS)
              │                           │
          Admins                     Their Team
                                          │
                              ┌───────────┼───────────┐
                              │           │           │
                           Owner       Admin      Developer
```

For this phase, we are implementing only:

```text
SUBSFLOW
   │
   └── SUBSFLOW TEAM
          │
        Admin
```

The Admin is an internal SubsFlow platform administrator.

---

# 1. Understand the Existing Project First

Before writing code:

1. Inspect the existing project structure.
2. Identify the backend technology and frontend technology already being used.
3. Inspect existing authentication/security implementation.
4. Inspect existing database entities, repositories, services, controllers, DTOs, and configurations.
5. Identify whether Tenant-related functionality already exists.
6. Reuse existing architecture and conventions wherever possible.
7. Do NOT unnecessarily rewrite existing code.
8. Do NOT introduce a new framework if an equivalent solution already exists in the project.

First provide a short assessment of the existing architecture and explain where the Admin functionality should fit.

Then implement the feature.

---

# 2. Purpose of the SubsFlow Admin

The SubsFlow Admin is responsible for managing the **SubsFlow platform itself**.

The Admin should be able to:

- See platform overview
- View all tenants
- View tenant details
- Activate/suspend tenants
- Monitor tenant status
- Manage platform-level configuration where appropriate
- View high-level platform statistics
- Search and filter tenants
- View important platform activity

The Admin is NOT responsible for managing a tenant's internal business operations.

For example:

```text
SubsFlow Admin
      ↓
Manages
      ↓
Tenant ABC
Tenant XYZ
Tenant PQR
```

But:

```text
SubsFlow Admin
      X
      ↓
Should NOT directly manage:
Tenant ABC's internal employees
Tenant ABC's individual customers
Tenant ABC's subscription plans
Tenant ABC's internal billing configuration
```

Those belong to the Tenant side, which will be implemented later.

---

# 3. Admin Dashboard

Create an Admin Dashboard as the main landing page after a successful SubsFlow Admin login.

The dashboard should contain:

### Overview cards

Display high-level platform metrics such as:

- Total Tenants
- Active Tenants
- Suspended Tenants
- New Tenants
- Total Active Subscriptions across the platform
- Platform Revenue, if the existing project already supports the required billing data

Do not create fake financial calculations if the backend does not yet support them.

If required data does not exist yet, clearly separate placeholder UI from real data.

---

# 4. Tenant Management

Create an Admin section:

```text
Admin
 ├── Dashboard
 ├── Tenants
 └── Settings
```

The **Tenants** page should display all tenants registered on SubsFlow.

For each tenant, show useful information such as:

- Tenant ID
- Company name
- Owner
- Email
- Created date
- Status
- Number of users, if available
- Subscription/system status, if available

Example:

```text
Tenant ID    Company        Owner       Status
------------------------------------------------
T001         Company A      Rahul       ACTIVE
T002         Company B      Amit        ACTIVE
T003         Company C      Priya       SUSPENDED
```

Provide:

- Search
- Filtering
- Sorting
- Pagination

Pagination should be server-side if the backend supports it or can reasonably implement it.

Do not load thousands of tenants into the browser at once.

---

# 5. Tenant Details

When the Admin selects a tenant, show a detailed tenant page.

Example:

```text
Tenant Details

Company: Company A
Tenant ID: T001
Owner: Rahul
Email: rahul@example.com
Created: ...
Status: ACTIVE
```

Organize information into logical sections.

Possible sections:

```text
Overview
Users
Activity
Configuration
```

Only display information that actually exists in the current backend.

Do not invent backend data just to fill the UI.

---

# 6. Tenant Status Management

The Admin should be able to change the platform status of a tenant.

Initial statuses:

```text
ACTIVE
SUSPENDED
```

The operation must:

1. Require authentication.
2. Verify that the logged-in user has the SubsFlow Admin role.
3. Validate the target tenant.
4. Update the tenant status.
5. Return a proper success/error response.
6. Record an audit event if an audit mechanism exists or can be cleanly introduced.

Do not allow a normal Tenant Owner/Admin/Developer to perform this operation.

---

# 7. Security

This is an internal platform administration area.

Implement proper authorization.

Do NOT rely only on hiding frontend routes.

The backend must enforce:

```text
Authenticated User
       ↓
Has SUBSFLOW_ADMIN role?
       ↓
YES → allow
NO  → return 403
```

Frontend route protection should also be implemented for good UX, but backend authorization is mandatory.

Do not trust:

- tenant_id sent by the frontend
- role sent by the frontend
- hidden UI buttons
- client-side authorization

The server must determine the authenticated user's identity and permissions.

---

# 8. Tenant Isolation

Even though this phase focuses on the SubsFlow Admin, maintain the multi-tenant architecture correctly.

The conceptual model is:

```text
SubsFlow
   │
   ├── Tenant T001
   │      └── Tenant data
   │
   ├── Tenant T002
   │      └── Tenant data
   │
   └── Tenant T003
          └── Tenant data
```

Do not create relationships that make tenant data ambiguous.

Every tenant-owned entity should eventually be traceable to its tenant.

If the existing project already has tenant_id or an equivalent tenant relationship, reuse it.

---

# 9. Audit Logging

Admin actions are sensitive.

Where appropriate, record:

```text
Who performed the action
What action was performed
Which tenant was affected
When it happened
```

Example:

```text
Admin: admin@subsflow.com
Action: SUSPEND_TENANT
Tenant: T003
Time: 2026-08-23 19:30
```

If a complete audit system does not yet exist, implement a clean foundation rather than building an unnecessarily complex logging system.

---

# 10. Admin Navigation

Create a clean Admin layout.

Suggested structure:

```text
┌─────────────────────────────────────────────┐
│ SubsFlow Admin                         User │
├──────────────┬──────────────────────────────┤
│              │                              │
│ Dashboard    │                              │
│ Tenants      │        Main Content          │
│ Settings     │                              │
│              │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

The UI should be:

- Clean
- Professional
- Responsive
- Easy to understand
- Suitable for an enterprise SaaS platform
- Consistent with the existing project design

Do not over-design it.

---

# 11. Backend Requirements

Follow the existing project architecture.

If the project uses:

```text
Controller
   ↓
Service
   ↓
Repository
   ↓
Database
```

continue using that pattern.

Create appropriate:

- Admin controller/API
- Admin service
- DTOs
- Tenant management APIs
- Validation
- Exception handling
- Authorization

Do not put business logic directly inside controllers.

---

# 12. API Design

Use RESTful APIs where appropriate.

For example:

```text
GET    /api/admin/dashboard
GET    /api/admin/tenants
GET    /api/admin/tenants/{tenantId}
PATCH  /api/admin/tenants/{tenantId}/status
```

Adjust the exact URLs to match the existing project's API conventions.

Do not blindly create duplicate endpoints if equivalent endpoints already exist.

---

# 13. Error Handling

Handle at least:

```text
401 Unauthorized
403 Forbidden
404 Tenant Not Found
400 Bad Request
409 Conflict where applicable
500 Internal Server Error
```

Return consistent API error responses using the project's existing exception/error handling mechanism.

---

# 14. Database

Before modifying the database:

1. Inspect the existing schema.
2. Reuse existing Tenant entities if present.
3. Do not duplicate Tenant tables/entities.
4. Add only the minimum required fields.
5. Maintain proper indexes for tenant lookup and status filtering.
6. Use migrations if the existing project uses migrations.

For example, tenant lookup will likely need efficient indexing around:

```text
tenant_id
status
created_at
```

Use the project's existing database conventions.

---

# 15. Do Not Implement Yet

Do NOT implement the following in this task:

```text
Tenant Owner Dashboard
Tenant Admin Dashboard
Tenant Developer Dashboard
End Customer Dashboard
Payment Gateway Integration
Subscription Plan Creation
Subscription Checkout
Advanced Billing
Advanced Invoicing
Usage-Based Billing
Notifications
Microservices
Kafka
Redis
Kubernetes
```

Those will be separate phases.

Do not introduce microservices just for the sake of making the project "industry level".

First build a clean modular foundation.

---

# 16. Expected Result

After this phase, the following should work:

```text
SubsFlow Admin Login
        ↓
Admin Dashboard
        ↓
View platform statistics
        ↓
Open Tenants
        ↓
Search / Filter tenants
        ↓
Open Tenant Details
        ↓
View tenant information
        ↓
Activate / Suspend tenant
        ↓
Action is authorized and audited
```

The final architecture should remain compatible with the larger system:

```text
                         SUBSFLOW
                            │
              ┌─────────────┴─────────────┐
              │                           │
        SUBSFLOW TEAM                 TENANTS
          (Us)                         (SaaS)
              │                           │
          Admins                     Their Team
                                          │
                              ┌───────────┼───────────┐
                              │           │           │
                           Owner       Admin      Developer
```

This task implements **only the left side**:

```text
SUBSFLOW
   │
   └── SUBSFLOW TEAM
          │
        Admin
```

Build it cleanly so that the Tenant side can be added later without restructuring the entire application.

Before modifying anything, inspect the existing codebase and explain the files/classes that need to be created or changed. Then implement the Admin module following the project's current conventions.