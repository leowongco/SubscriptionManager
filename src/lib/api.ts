const API_BASE = '/api';

export const api = {
    // Services
    getServices: () => fetch(`${API_BASE}/services`).then(res => res.json()),
    createService: (data: any) => fetch(`${API_BASE}/services`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
    updateService: (data: any) => fetch(`${API_BASE}/services`, { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json()),
    deleteService: (id: string) => fetch(`${API_BASE}/services?id=${id}`, { method: 'DELETE' }).then(res => res.json()),

    // Accounts
    getAccounts: () => fetch(`${API_BASE}/accounts`).then(res => res.json()),
    createAccount: (data: any) => fetch(`${API_BASE}/accounts`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
    updateAccount: (data: any) => fetch(`${API_BASE}/accounts`, { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json()),
    deleteAccount: (id: string) => fetch(`${API_BASE}/accounts?id=${id}`, { method: 'DELETE' }).then(res => res.json()),
    adjustAccountBalance: (accountId: string, data: { adjustment_amount: number; reason: string; operator: string }) =>
        fetch(`${API_BASE}/accounts/${accountId}/balance`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    // Members
    getMembers: () => fetch(`${API_BASE}/members`).then(res => res.json()),
    createMember: (data: any) => fetch(`${API_BASE}/members`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
    updateMember: (data: any) => fetch(`${API_BASE}/members`, { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json()),
    deleteMember: (id: string) => fetch(`${API_BASE}/members?id=${id}`, { method: 'DELETE' }).then(res => res.json()),

    // History
    getHistory: () => fetch(`${API_BASE}/history`).then(res => res.json()),
    batchRecharge: (data: any[]) => fetch(`${API_BASE}/recharge`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
    // 新格式批次加值
    batchRechargeByGroup: (data: { account_ids: string[]; amount: number; reason: string; operator: string; gift_card?: string }) =>
        fetch(`${API_BASE}/recharge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    // Subscriptions
    getSubscriptions: (accountId?: string) => fetch(`${API_BASE}/subscriptions${accountId ? `?account_id=${accountId}` : ''}`).then(res => res.json()),
    addSubscription: (data: any) => fetch(`${API_BASE}/subscriptions`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
    removeSubscription: (id: string) => fetch(`${API_BASE}/subscriptions?id=${id}`, { method: 'DELETE' }).then(res => res.json()),

    // Telegram Groups
    getTelegramGroups: (filters?: { billing_day?: number; billing_cycle_type?: string }) => {
        const params = new URLSearchParams();
        if (filters?.billing_day) params.append('billing_day', filters.billing_day.toString());
        if (filters?.billing_cycle_type) params.append('billing_cycle_type', filters.billing_cycle_type);
        const queryString = params.toString();
        return fetch(`${API_BASE}/telegram-groups${queryString ? `?${queryString}` : ''}`).then(res => res.json());
    },
    getTelegramGroup: (id: string) => fetch(`${API_BASE}/telegram-groups?id=${id}`).then(res => res.json()),
    createTelegramGroup: (data: any) => fetch(`${API_BASE}/telegram-groups`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
    updateTelegramGroup: (id: string, data: any) => fetch(`${API_BASE}/telegram-groups?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json()),
    deleteTelegramGroup: (id: string) => fetch(`${API_BASE}/telegram-groups?id=${id}`, { method: 'DELETE' }).then(res => res.json()),

    // Billing Cycles
    getBillingCycles: (filters?: { telegram_group_id?: string; status?: string }) => {
        const params = new URLSearchParams();
        if (filters?.telegram_group_id) params.append('telegram_group_id', filters.telegram_group_id);
        if (filters?.status) params.append('status', filters.status);
        const queryString = params.toString();
        return fetch(`${API_BASE}/billing-cycles${queryString ? `?${queryString}` : ''}`).then(res => res.json());
    },
    getBillingCycle: (id: string) => fetch(`${API_BASE}/billing-cycles?id=${id}`).then(res => res.json()),
    createBillingCycle: (data: any) => fetch(`${API_BASE}/billing-cycles`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
    updateBillingCycle: (id: string, data: any) => fetch(`${API_BASE}/billing-cycles?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json()),
    deleteBillingCycle: (id: string) => fetch(`${API_BASE}/billing-cycles?id=${id}`, { method: 'DELETE' }).then(res => res.json()),

    // Member Payments
    getMemberPayments: (filters?: { billing_cycle_id?: string; account_id?: string; status?: string }) => {
        const params = new URLSearchParams();
        if (filters?.billing_cycle_id) params.append('billing_cycle_id', filters.billing_cycle_id);
        if (filters?.account_id) params.append('account_id', filters.account_id);
        if (filters?.status) params.append('status', filters.status);
        const queryString = params.toString();
        return fetch(`${API_BASE}/member-payments${queryString ? `?${queryString}` : ''}`).then(res => res.json());
    },
    getMemberPayment: (id: string) => fetch(`${API_BASE}/member-payments?id=${id}`).then(res => res.json()),
    createMemberPayment: (data: any) => fetch(`${API_BASE}/member-payments`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
    updateMemberPayment: (id: string, data: any) => fetch(`${API_BASE}/member-payments?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json()),
    refundMemberPayment: (data: { member_payment_id: string; refund_amount: number }) =>
        fetch(`${API_BASE}/member-payments/refund`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
};
