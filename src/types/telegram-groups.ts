// Telegram Group 相關類型定義

export interface TelegramGroup {
  id: string;
  name: string;
  telegram_link: string | null;
  billing_day: number; // 1-31
  billing_cycle_type: 'monthly' | 'biannually' | 'yearly';
  notes: string | null;
  created_at: string;
  account_count?: number;
}

export interface BillingCycle {
  id: string;
  telegram_group_id: string;
  start_date: string;
  end_date: string;
  amount_per_member: number;
  status: 'active' | 'completed' | 'refunded';
  created_at: string;
  member_payments?: MemberPayment[];
}

export interface MemberPayment {
  id: string;
  billing_cycle_id: string;
  member_id: string;
  paid: boolean;
  paid_at: string | null;
  refund_amount: number | null;
  refund_at: string | null;
  created_at: string;
  // 關聯數據
  member?: {
    id: string;
    email: string;
    memo: string | null;
  };
}

export interface TelegramGroupDetail extends TelegramGroup {
  subscriptions: SubscriptionWithMembers[];
  billing_cycles: BillingCycle[];
}

export interface SubscriptionWithMembers {
  id: string;
  account_id: string;
  service_id: string;
  telegram_group_id: string | null;
  service_account: string | null;
  start_date: string | null;
  service_name: string;
  base_price: number;
  currency: string;
  cycle: string;
  apple_id: string | null;
  account_balance: number;
  members: Member[];
}

export interface Member {
  id: string;
  subscription_id: string | null;
  email: string;
  payment_status: boolean;
  memo: string | null;
}

// API 請求類型
export interface CreateGroupRequest {
  name: string;
  telegram_link?: string;
  billing_day: number;
  billing_cycle_type: 'monthly' | 'biannually' | 'yearly';
  notes?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  telegram_link?: string;
  billing_day?: number;
  billing_cycle_type?: 'monthly' | 'biannually' | 'yearly';
  notes?: string;
}

export interface CreateBillingCycleRequest {
  telegram_group_id: string;
  start_date: string;
  end_date: string;
  amount_per_member: number;
}

// 統計數據類型
export interface GroupStats {
  totalGroups: number;
  activeGroups: number;
  totalRevenue: number;
  collectedRevenue: number;
}
