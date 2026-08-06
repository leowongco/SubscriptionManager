// Telegram Group 相關類型定義

export interface TelegramGroup {
  id: string;
  name: string;
  telegram_link: string | null;
  start_date: string; // 開始收款日期（錨點），跟 billing_cycle_type 一起決定往後的收款週期
  billing_cycle_type: 'monthly' | 'biannually' | 'yearly';
  // 這個群組實際聊天室的 chat_id，設定後繳費提醒會直接發到群組裡（不需要每個成員各自綁定）
  chat_id: string | null;
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
  last_group_reminded_at?: string | null;
  member_payments?: MemberPayment[];
}

export interface MemberPayment {
  id: string;
  billing_cycle_id: string;
  member_id: string;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  refund_amount: number | null;
  refund_at: string | null;
  // 成員在 Telegram bot 裡自己按「我已繳費」回報的時間；只是回報，不代表已確認收款，
  // 要靠管理員按「確認收款」才會真的變成 paid。
  payment_reported_at: string | null;
  last_reminded_at: string | null;
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
  telegram_chat_id: string | null;
  telegram_bound_at: string | null;
}

// API 請求類型
export interface CreateGroupRequest {
  name: string;
  telegram_link?: string;
  start_date: string;
  billing_cycle_type: 'monthly' | 'biannually' | 'yearly';
  chat_id?: string;
  notes?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  telegram_link?: string;
  start_date?: string;
  billing_cycle_type?: 'monthly' | 'biannually' | 'yearly';
  chat_id?: string;
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
