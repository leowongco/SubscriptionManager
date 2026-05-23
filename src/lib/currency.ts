/**
 * 貨幣工具函數
 * 用於格式化和顯示不同貨幣
 */

/**
 * 匯率說明：
 * - 這些是固定匯率，以 HKD 為基準
 * - 匯率值需要定期手動更新以反映市場匯率
 * - 未來可考慮整合外部匯率 API（如 Open Exchange Rates）
 */

// 支援的貨幣類型
export type Currency = 'HKD' | 'TRY' | 'USD' | 'TWD' | 'ARS' | string;

// 貨幣符號映射
export const CURRENCY_SYMBOLS: Record<string, string> = {
    HKD: 'HK$',
    TRY: '₺',
    USD: '$',
    TWD: 'NT$',
    ARS: 'AR$',
};

// 貨幣名稱映射（用於顯示）
export const CURRENCY_NAMES: Record<string, string> = {
    HKD: '港幣',
    TRY: '土耳其幣',
    USD: '美元',
    TWD: '台幣',
    ARS: '阿根廷披索',
};

// 匯率轉換（以 HKD 為基準）
export const EXCHANGE_RATES: Record<string, number> = {
    HKD: 1,
    TRY: 0.23,
    USD: 7.82,
    TWD: 0.24,
    ARS: 0.0076,
};

/**
 * 獲取貨幣符號
 */
export function getCurrencySymbol(currency: Currency): string {
    return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * 獲取貨幣名稱
 */
export function getCurrencyName(currency: Currency): string {
    return CURRENCY_NAMES[currency] || currency;
}

/**
 * 格式化金額顯示（使用 Intl.NumberFormat）
 * @param amount 金額
 * @param currency 貨幣類型
 * @param locale 地區設定（默認 zh-TW）
 */
export function formatCurrency(
    amount: number,
    currency: Currency = 'HKD',
    locale: string = 'zh-TW'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * 格式化金額顯示（帶貨幣代碼）
 * @param amount 金額
 * @param currency 貨幣類型
 * @param locale 地區設定（默認 zh-TW）
 */
export function formatCurrencyWithCode(
    amount: number,
    currency: Currency = 'HKD',
    locale: string = 'zh-TW'
): string {
    const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ${currency}`;
}

/**
 * 轉換貨幣到 HKD
 * @param amount 金額
 * @param fromCurrency 來源貨幣
 */
export function convertToHKD(amount: number, fromCurrency: Currency): number {
    const rate = EXCHANGE_RATES[fromCurrency] || 1;
    return amount * rate;
}

/**
 * 轉換貨幣
 * @param amount 金額
 * @param fromCurrency 來源貨幣
 * @param toCurrency 目標貨幣
 */
export function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency): number {
    // 先轉換為 HKD
    const hkdAmount = convertToHKD(amount, fromCurrency);
    // 再轉換為目標貨幣
    const toRate = EXCHANGE_RATES[toCurrency] || 1;
    return hkdAmount / toRate;
}

/**
 * 獲取所有支援的貨幣選項
 */
export function getSupportedCurrencies(): Array<{ value: string; label: string; symbol: string }> {
    return Object.keys(CURRENCY_SYMBOLS).map(code => ({
        value: code,
        label: CURRENCY_NAMES[code] || code,
        symbol: CURRENCY_SYMBOLS[code],
    }));
}
