// src/components/dashboard/QuickActions.tsx

import { type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Calendar, Download } from 'lucide-react';

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

function QuickActionButton({ icon, label, onClick, variant = 'secondary' }: QuickActionProps) {
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500',
    secondary: 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-200 border-neutral-700',
    outline: 'bg-transparent hover:bg-neutral-800/40 text-neutral-300 border-neutral-700'
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all
        backdrop-blur-sm font-medium text-sm
        ${variantStyles[variant]}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function QuickActions() {
  const handleQuickRecharge = () => {
    // Navigate to recharge page
    window.location.href = '/recharge';
  };

  const handleViewUpcoming = () => {
    // Scroll to warnings section
    const warningsSection = document.getElementById('warnings-section');
    if (warningsSection) {
      warningsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExportReport = () => {
    // Export functionality
    console.log('Export report');
  };

  return (
    <Card className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 shadow-2xl">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg">
            <span className="text-lg">🎯</span>
          </div>
          <h3 className="text-lg font-bold text-neutral-100">快速行動</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <QuickActionButton
            icon={<Plus className="w-4 h-4" />}
            label="一鍵加值"
            onClick={handleQuickRecharge}
            variant="primary"
          />
          <QuickActionButton
            icon={<Calendar className="w-4 h-4" />}
            label="查看即將到期"
            onClick={handleViewUpcoming}
            variant="secondary"
          />
          <QuickActionButton
            icon={<Download className="w-4 h-4" />}
            label="匯出報告"
            onClick={handleExportReport}
            variant="outline"
          />
        </div>
      </CardContent>
    </Card>
  );
}