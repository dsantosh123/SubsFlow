# SubsFlow

SubsFlow is a multi-tenant SaaS subscription management platform that enables SaaS businesses to manage their products, pricing plans, customers, subscriptions, billing, payments, integrations, webhooks, usage, notifications, and analytics from a single platform.

## Overview

SubsFlow provides the infrastructure and management layer for SaaS businesses.

A SaaS business becomes a **Tenant** in SubsFlow and manages its own products, plans, customers, and subscriptions.

Example:

```text
                         SUBSFLOW
                            │
                    ┌───────┴───────┐
                    │               │
             Platform Team       Tenants
                    │               │
                  Admin         SaaS Business
                                    │
                              ┌─────┴─────┐
                              │           │
                           Owner        Team
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                 Products    Plans   Customers
                                      │
                                Subscriptions
                                      │
                                   Billing
                                      │
                                   Payments
