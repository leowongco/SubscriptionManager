// 批次加值相關類型定義

import type { AccountType } from '@/lib/accountType';

export interface RechargeAccount {
  id: string;
  apple_id: string | null;
  account_type?: AccountType;
  balance: number;
  currency?: string;
  telegram_group_id?: string | null;
  telegram_group_name?: string | null;
}

export interface RechargeFormData {
  amount: number;
  reason: string;
  operator: string;
  gift_card?: string;
}

export interface RechargePreview {
  account_id: string;
  apple_id: string | null;
  current_balance: number;
  recharge_amount: number;
  new_balance: number;
  currency?: string;
}

export interface RechargeResult {
  account_id: string;
  apple_id: string | null;
  success: boolean;
  message?: string;
  new_balance?: number;
}

export interface RechargeProgress {
  total: number;
  completed: number;
  success: number;
  failed: number;
  results: RechargeResult[];
  isProcessing: boolean;
}

export interface BatchRechargeRequest {
  account_ids: string[];
  amount: number;
  reason: string;
  operator: string;
  gift_card?: string;
}

export interface BatchRechargeResponse {
  message: string;
  processed: number;
  results: RechargeResult[];
}
