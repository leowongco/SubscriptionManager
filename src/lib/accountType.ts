import { SiApple, SiGoogle } from 'react-icons/si';
import { HelpCircle } from 'lucide-react';
import type { IconType } from 'react-icons';

export type AccountType = 'apple' | 'google' | 'other';

interface AccountTypeMeta {
    value: AccountType;
    label: string;
    fieldLabel: string;
    placeholder: string;
    icon: IconType | typeof HelpCircle;
    colorPalette: string;
}

export const ACCOUNT_TYPES: AccountTypeMeta[] = [
    {
        value: 'apple',
        label: 'Apple ID',
        fieldLabel: 'Apple ID (付款帳號)',
        placeholder: 'example@icloud.com',
        icon: SiApple,
        colorPalette: 'gray',
    },
    {
        value: 'google',
        label: 'Google 帳號',
        fieldLabel: 'Google 帳號 (Email)',
        placeholder: 'example@gmail.com',
        icon: SiGoogle,
        colorPalette: 'blue',
    },
    {
        value: 'other',
        label: '其他',
        fieldLabel: '帳號識別碼',
        placeholder: '用於識別此訂閱帳號的 ID 或 Email',
        icon: HelpCircle,
        colorPalette: 'purple',
    },
];

export function getAccountTypeMeta(type?: string | null): AccountTypeMeta {
    return ACCOUNT_TYPES.find(t => t.value === type) || ACCOUNT_TYPES[0];
}
