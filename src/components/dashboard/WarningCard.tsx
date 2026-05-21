// src/components/dashboard/WarningCard.tsx

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface WarningCardProps {
  account: {
    id: string;
    apple_id: string;
    balance: number;
    currency: string;
    _monthlyBurn?: number;
    _monthsLeft?: number;
    subscriptions?: any[];
  };
}

function getWarningLevel(monthsLeft: number) {
  if (monthsLeft < 0.5) {
    return {
      level: 'critical',
      color: 'red',
      bgColor: 'bg-red-950/20',
      borderColor: 'border-red-600/50',
      textColor: 'text-red-300',
      badgeClass: 'bg-red-600 animate-pulse',
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />
    };
  } else if (monthsLeft < 1.5) {
    return {
      level: 'warning',
      color: 'orange',
      bgColor: 'bg-orange-950/20',
      borderColor: 'border-orange-600/50',
      textColor: 'text-orange-300',
      badgeClass: 'bg-orange-600',
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />
    };
  } else {
    return {
      level: 'normal',
      color: 'yellow',
      bgColor: 'bg-yellow-950/20',
      borderColor: 'border-yellow-600/50',
      textColor: 'text-yellow-300',
      badgeClass: 'bg-yellow-600',
      icon: <TrendingUp className="w-4 h-4 text-yellow-500" />
    };
  }
}

export function WarningCard({ account }: WarningCardProps) {
  const monthsLeft = account._monthsLeft || 0;
  const warning = getWarningLevel(monthsLeft);

  return (
    <div
      className={`
        p-4 rounded-xl border backdrop-blur-md
        flex flex-col gap-2 transition-all
        ${warning.bgColor} ${warning.borderColor}
        hover:scale-[1.02] hover:shadow-lg
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-neutral-800/40 pb-2">
        <div className="flex items-center gap-2">
          {warning.icon}
          <div className="font-bold text-sm md:text-base truncate pr-2">
            {account.apple_id}
          </div>
        </div>
        <Badge className={warning.badgeClass}>
          {monthsLeft.toFixed(1)} 月
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col">
          <span className="text-neutral-500">餘額</span>
          <span className={`font-bold ${warning.textColor}`}>
            {account.currency} {account.balance.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-neutral-500">月支出</span>
          <span className={`font-bold ${warning.textColor}`}>
            {account.currency} {(account._monthlyBurn || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Subscriptions */}
      {account.subscriptions && account.subscriptions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-800/40">
          <div className="text-xs text-neutral-500 mb-1">訂閱服務</div>
          <div className="space-y-1">
            {account.subscriptions.slice(0, 3).map((sub: any) => (
              <div key={sub.id} className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 truncate max-w-[120px]">
                  {sub.service_name}
                </span>
                <span className="font-mono text-neutral-300">
                  {sub.currency} {(sub.base_price || 0).toFixed(2)}
                </span>
              </div>
            ))}
            {account.subscriptions.length > 3 && (
              <div className="text-xs text-neutral-500">
                +{account.subscriptions.length - 3} 更多...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}