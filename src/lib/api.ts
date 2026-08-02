import { toaster } from '@/components/ui/toaster';

const API_BASE = '/api';

// 錯誤處理函數
function handleApiError(error: Error, title: string = '操作失敗') {
    toaster.create({
        title,
        description: error.message,
        type: 'error',
        duration: 5000,
        closable: true,
    });
}

// 包裝 fetch 調用，自動處理錯誤
async function fetchWithErrorHandling<T = any>(
    url: string,
    options?: RequestInit,
    errorTitle?: string
): Promise<T> {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '網絡錯誤' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        handleApiError(err, errorTitle);
        throw err;
    }
}

export const api = {
    // Services
    getServices: () => fetchWithErrorHandling(`${API_BASE}/services`, undefined, '獲取服務列表失敗'),
    createService: (data: any) => fetchWithErrorHandling(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '創建服務失敗'),
    updateService: (data: any) => fetchWithErrorHandling(`${API_BASE}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '更新服務失敗'),
    deleteService: (id: string) => fetchWithErrorHandling(`${API_BASE}/services?id=${id}`, {
        method: 'DELETE'
    }, '刪除服務失敗'),

    // Accounts
    getAccounts: () => fetchWithErrorHandling(`${API_BASE}/accounts`, undefined, '獲取帳號列表失敗'),
    createAccount: (data: any) => fetchWithErrorHandling(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '創建帳號失敗'),
    updateAccount: (data: any) => fetchWithErrorHandling(`${API_BASE}/accounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '更新帳號失敗'),
    deleteAccount: (id: string) => fetchWithErrorHandling(`${API_BASE}/accounts?id=${id}`, {
        method: 'DELETE'
    }, '刪除帳號失敗'),
    adjustAccountBalance: (accountId: string, data: { adjustment_amount: number; reason: string; operator: string }) =>
        fetchWithErrorHandling(`${API_BASE}/accounts/${accountId}/balance`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }, '調整餘額失敗'),

    // Members
    getMembers: () => fetchWithErrorHandling(`${API_BASE}/members`, undefined, '獲取成員列表失敗'),
    createMember: (data: any) => fetchWithErrorHandling(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '創建成員失敗'),
    updateMember: (data: any) => fetchWithErrorHandling(`${API_BASE}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '更新成員失敗'),
    deleteMember: (id: string) => fetchWithErrorHandling(`${API_BASE}/members?id=${id}`, {
        method: 'DELETE'
    }, '刪除成員失敗'),

    // History
    getHistory: () => fetchWithErrorHandling(`${API_BASE}/history`, undefined, '獲取歷史記錄失敗'),
    batchRecharge: (data: any[]) => fetchWithErrorHandling(`${API_BASE}/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '批次加值失敗'),
    // 新格式批次加值
    batchRechargeByGroup: (data: { account_ids: string[]; amount: number; reason: string; operator: string; gift_card?: string }) =>
        fetchWithErrorHandling(`${API_BASE}/recharge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }, '批次加值失敗'),

    // Subscriptions
    getSubscriptions: (accountId?: string) => fetchWithErrorHandling(
        `${API_BASE}/subscriptions${accountId ? `?account_id=${accountId}` : ''}`,
        undefined,
        '獲取訂閱列表失敗'
    ),
    addSubscription: (data: any) => fetchWithErrorHandling(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '添加訂閱失敗'),
    updateSubscription: (id: string, data: any) => fetchWithErrorHandling(`${API_BASE}/subscriptions?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '更新訂閱失敗'),
    removeSubscription: (id: string) => fetchWithErrorHandling(`${API_BASE}/subscriptions?id=${id}`, {
        method: 'DELETE'
    }, '移除訂閱失敗'),

    // Telegram Groups
    getTelegramGroups: (filters?: { billing_day?: number; billing_cycle_type?: string }) => {
        const params = new URLSearchParams();
        if (filters?.billing_day) params.append('billing_day', filters.billing_day.toString());
        if (filters?.billing_cycle_type) params.append('billing_cycle_type', filters.billing_cycle_type);
        const queryString = params.toString();
        return fetchWithErrorHandling(
            `${API_BASE}/telegram-groups${queryString ? `?${queryString}` : ''}`,
            undefined,
            '獲取 Telegram 群組列表失敗'
        );
    },
    getTelegramGroup: (id: string) => fetchWithErrorHandling(`${API_BASE}/telegram-groups?id=${id}`, undefined, '獲取群組詳情失敗'),
    createTelegramGroup: (data: any) => fetchWithErrorHandling(`${API_BASE}/telegram-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '創建群組失敗'),
    updateTelegramGroup: (id: string, data: any) => fetchWithErrorHandling(`${API_BASE}/telegram-groups?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '更新群組失敗'),
    deleteTelegramGroup: (id: string) => fetchWithErrorHandling(`${API_BASE}/telegram-groups?id=${id}`, {
        method: 'DELETE'
    }, '刪除群組失敗'),

    // Billing Cycles
    getBillingCycles: (filters?: { telegram_group_id?: string; status?: string }) => {
        const params = new URLSearchParams();
        if (filters?.telegram_group_id) params.append('telegram_group_id', filters.telegram_group_id);
        if (filters?.status) params.append('status', filters.status);
        const queryString = params.toString();
        return fetchWithErrorHandling(
            `${API_BASE}/billing-cycles${queryString ? `?${queryString}` : ''}`,
            undefined,
            '獲取帳單週期失敗'
        );
    },
    getBillingCycle: (id: string) => fetchWithErrorHandling(`${API_BASE}/billing-cycles?id=${id}`, undefined, '獲取帳單週期詳情失敗'),
    createBillingCycle: (data: any) => fetchWithErrorHandling(`${API_BASE}/billing-cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '創建帳單週期失敗'),
    updateBillingCycle: (id: string, data: any) => fetchWithErrorHandling(`${API_BASE}/billing-cycles?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '更新帳單週期失敗'),
    deleteBillingCycle: (id: string) => fetchWithErrorHandling(`${API_BASE}/billing-cycles?id=${id}`, {
        method: 'DELETE'
    }, '刪除帳單週期失敗'),

    // Member Payments
    getMemberPayments: (filters?: { billing_cycle_id?: string; account_id?: string; status?: string }) => {
        const params = new URLSearchParams();
        if (filters?.billing_cycle_id) params.append('billing_cycle_id', filters.billing_cycle_id);
        if (filters?.account_id) params.append('account_id', filters.account_id);
        if (filters?.status) params.append('status', filters.status);
        const queryString = params.toString();
        return fetchWithErrorHandling(
            `${API_BASE}/member-payments${queryString ? `?${queryString}` : ''}`,
            undefined,
            '獲取付款記錄失敗'
        );
    },
    getMemberPayment: (id: string) => fetchWithErrorHandling(`${API_BASE}/member-payments?id=${id}`, undefined, '獲取付款詳情失敗'),
    createMemberPayment: (data: any) => fetchWithErrorHandling(`${API_BASE}/member-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '創建付款記錄失敗'),
    updateMemberPayment: (id: string, data: any) => fetchWithErrorHandling(`${API_BASE}/member-payments?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }, '更新付款記錄失敗'),
    refundMemberPayment: (data: { member_payment_id: string; refund_amount: number }) =>
        fetchWithErrorHandling(`${API_BASE}/member-payments/refund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }, '退款失敗'),
};
