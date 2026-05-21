// src/types/dashboard.ts

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'outline';
}

export interface WarningLevel {
  level: 'normal' | 'warning' | 'critical';
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export interface BalanceTrendData {
  date: string;
  balance: number;
  currency: string;
}

export interface AccountWithWarning {
  id: string;
  apple_id: string;
  balance: number;
  currency: string;
  monthlyBurn: number;
  monthsLeft: number;
  subscriptions: unknown[];
  warningLevel: WarningLevel;
}