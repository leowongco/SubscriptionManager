# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-05-21

### Added
- **Telegram Groups Management**: New pages for managing Telegram groups with billing cycles and member payments
  - [`TelegramGroups.tsx`](src/pages/TelegramGroups.tsx) - Group list page
  - [`TelegramGroupDetail.tsx`](src/pages/TelegramGroupDetail.tsx) - Group detail page with billing cycle cards
- **Account Management**: Enhanced account management with balance adjustment dialog
  - [`Accounts.tsx`](src/pages/Accounts.tsx) - Apple ID management page
  - [`BalanceAdjustDialog.tsx`](src/components/accounts/BalanceAdjustDialog.tsx) - Balance adjustment dialog
- **Enhanced Recharge**: Batch recharge with preview and progress tracking
  - [`Recharge.tsx`](src/pages/Recharge.tsx) - Enhanced batch recharge page
  - [`AccountSelector.tsx`](src/components/recharge/AccountSelector.tsx) - Account selection component
  - [`RechargePreview.tsx`](src/components/recharge/RechargePreview.tsx) - Recharge preview component
  - [`RechargeProgress.tsx`](src/components/recharge/RechargeProgress.tsx) - Progress tracking component
- **Dashboard Components**: New dashboard visualization components
  - [`BalanceTrendChart.tsx`](src/components/dashboard/BalanceTrendChart.tsx) - Balance trend chart with recharts
  - [`QuickActions.tsx`](src/components/dashboard/QuickActions.tsx) - Quick action buttons
  - [`WarningCard.tsx`](src/components/dashboard/WarningCard.tsx) - Warning cards with progressive severity
- **Backend API**: New API endpoints for extended functionality
  - [`telegram-groups.ts`](functions/api/telegram-groups.ts) - Telegram groups CRUD
  - [`billing-cycles.ts`](functions/api/billing-cycles.ts) - Billing cycle management
  - [`member-payments.ts`](functions/api/member-payments.ts) - Member payment tracking
  - [`audit.ts`](functions/api/audit.ts) - Audit log queries
  - [`balance-adjustments.ts`](functions/api/balance-adjustments.ts) - Balance adjustment records
  - [`accounts/[id]/balance.ts`](functions/api/accounts/[id]/balance.ts) - Account balance adjustment endpoint
- **Database Migrations**: Schema updates for new features
  - [`update_schema_v6.sql`](update_schema_v6.sql) - telegram_groups, billing_cycles, member_payments tables
  - [`update_schema_v7.sql`](update_schema_v7.sql) - audit_logs, balance_adjustments tables
  - [`update_schema_v8.sql`](update_schema_v8.sql) - Additional fields
- **UI Components**: Chakra UI v3 components
  - [`checkbox.tsx`](src/components/ui/checkbox.tsx) - Checkbox component
  - [`color-mode.tsx`](src/components/ui/color-mode.tsx) - Color mode toggle
  - [`field.tsx`](src/components/ui/field.tsx) - Form field wrapper
  - [`provider.tsx`](src/components/ui/provider.tsx) - Chakra provider
  - [`toaster.tsx`](src/components/ui/toaster.tsx) - Toast notifications
  - [`tooltip.tsx`](src/components/ui/tooltip.tsx) - Tooltip component

### Changed
- Migrated from Tailwind CSS to Chakra UI v3 for all components
- Enhanced ESLint configuration for better TypeScript support
- Updated all dashboard components with Chakra UI styling
- Improved type safety with new type definitions

### Technical
- Added VERSION file for semantic versioning
- Updated package.json version to 0.1.0
- Configured ESLint rules for progressive type improvement
