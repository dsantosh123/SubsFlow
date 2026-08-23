SubsFlow Phase 2 — Tenant Onboarding & Team

Phase 1 (SubsFlow Admin) is complete. Now implement only Phase 2.

Goal

Allow a SaaS company to come to SubsFlow, create its own account/workspace, and manage its team.

Flow
SaaS Company
     ↓
Tenant Registration
     ↓
Company + Owner created
     ↓
Owner Login
     ↓
Tenant Workspace
     ↓
Invite Team Members
     ├── Admin
     └── Developer
Roles
OWNER       → Full control of their tenant
ADMIN       → Manage tenant operations/team
DEVELOPER   → Developer/API-related access
Backend
Create a proper TenantUser entity/table.
Connect each user to exactly one Tenant.
Add email + password authentication for Tenant users.
Store passwords securely using BCrypt.
Create Tenant JWT containing:
tenantId
userId
role
Implement tenant registration:
company name
owner name
owner email
password
Automatically create the Tenant Owner during registration.
Implement team member invitation/creation for OWNER/ADMIN.
Enforce tenant isolation on every tenant-user operation.
Frontend

Add:

Tenant Registration screen
Tenant Login screen
Tenant Workspace/Dashboard
Team Management page
Invite Team Member form
Role selection: Admin / Developer
Important
Keep Phase 1 Admin functionality unchanged.
Do NOT add subscription plans, billing, payments, customers, invoices, or SaaS product integration yet.
Do NOT allow users to create SUBSFLOW_ADMIN.
Existing tenant data must not break.
Do not duplicate user/tenant concepts unnecessarily.
Follow the existing project architecture and design.
First inspect the existing authentication, Tenant entity, database migrations, RLS, and frontend routing before making changes.
Final verification

Test:

Register Tenant
     ↓
Owner created
     ↓
Owner Login
     ↓
Tenant Dashboard
     ↓
Invite Admin
     ↓
Admin Login
     ↓
Admin sees only that Tenant's data

Also verify that Tenant A cannot access Tenant B's data and that the existing SubsFlow Admin login still works.

Implement only Phase 2. Do not redesign Phase 1 or add future-phase features.