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

    // Members
    getMembers: () => fetch(`${API_BASE}/members`).then(res => res.json()),
    createMember: (data: any) => fetch(`${API_BASE}/members`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json()),
    updateMember: (data: any) => fetch(`${API_BASE}/members`, { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json()),
    deleteMember: (id: string) => fetch(`${API_BASE}/members?id=${id}`, { method: 'DELETE' }).then(res => res.json()),

    // History
    getHistory: () => fetch(`${API_BASE}/history`).then(res => res.json()),
    batchRecharge: (data: any[]) => fetch(`${API_BASE}/recharge`, { method: 'POST', body: JSON.stringify(data) }).then(res => res.json())
};
