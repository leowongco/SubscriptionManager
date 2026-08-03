import { describe, it, expect } from 'vitest';
import {
    getCurrencySymbol,
    getCurrencyName,
    formatCurrency,
    formatCurrencyWithCode,
    convertToHKD,
    convertCurrency,
    getRegionLabel,
    getSupportedCurrencies,
} from './currency';

describe('getCurrencySymbol', () => {
    it('回傳已知貨幣的符號', () => {
        expect(getCurrencySymbol('TRY')).toBe('₺');
        expect(getCurrencySymbol('HKD')).toBe('HK$');
    });

    it('未知貨幣代碼直接原樣回傳', () => {
        expect(getCurrencySymbol('XYZ')).toBe('XYZ');
    });
});

describe('getCurrencyName', () => {
    it('回傳已知貨幣的中文名稱', () => {
        expect(getCurrencyName('TRY')).toBe('土耳其幣');
    });

    it('未知貨幣代碼直接原樣回傳', () => {
        expect(getCurrencyName('XYZ')).toBe('XYZ');
    });
});

describe('getRegionLabel', () => {
    it('沒有帳號地區時顯示未設定', () => {
        expect(getRegionLabel(undefined)).toBe('未設定地區');
        expect(getRegionLabel(null)).toBe('未設定地區');
    });

    it('已知地區顯示中文名稱＋貨幣代碼', () => {
        expect(getRegionLabel('TRY')).toBe('土耳其（TRY）');
    });

    it('未知地區代碼直接原樣回傳', () => {
        expect(getRegionLabel('XYZ')).toBe('XYZ');
    });
});

describe('formatCurrency', () => {
    it('用 Intl.NumberFormat 格式化並固定兩位小數', () => {
        expect(formatCurrency(1199.2, 'TRY')).toContain('1,199.20');
    });

    it('沒帶貨幣時預設 HKD', () => {
        const result = formatCurrency(100);
        expect(result).toContain('100.00');
    });
});

describe('formatCurrencyWithCode', () => {
    it('金額後面附上貨幣代碼', () => {
        expect(formatCurrencyWithCode(50, 'USD')).toContain('USD');
    });
});

describe('convertToHKD / convertCurrency', () => {
    it('convertToHKD 用固定匯率換算成 HKD', () => {
        // TRY 匯率 0.23：100 TRY = 23 HKD
        expect(convertToHKD(100, 'TRY')).toBeCloseTo(23, 5);
    });

    it('convertToHKD 對 HKD 本身是恒等變換', () => {
        expect(convertToHKD(100, 'HKD')).toBe(100);
    });

    it('未知貨幣視為匯率 1（不換算）', () => {
        expect(convertToHKD(100, 'XYZ')).toBe(100);
    });

    it('convertCurrency 先轉 HKD 再轉目標貨幣，往返應該還原金額', () => {
        const amount = 500;
        const converted = convertCurrency(amount, 'TRY', 'USD');
        const roundTripped = convertCurrency(converted, 'USD', 'TRY');
        expect(roundTripped).toBeCloseTo(amount, 5);
    });
});

describe('getSupportedCurrencies', () => {
    it('回傳所有已定義貨幣符號對應的選項清單', () => {
        const currencies = getSupportedCurrencies();
        const codes = currencies.map((c) => c.value);
        expect(codes).toContain('HKD');
        expect(codes).toContain('TRY');
        expect(currencies.find((c) => c.value === 'TRY')?.symbol).toBe('₺');
    });
});
