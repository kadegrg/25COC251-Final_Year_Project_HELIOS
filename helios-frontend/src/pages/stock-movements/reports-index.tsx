import { useNavigate } from 'react-router-dom';
import { PageHeader, SectionCard } from '@/components/common';
import { BarChart3, AlertTriangle, TrendingDown, Scale, ClipboardList, RefreshCw } from 'lucide-react';

const reports = [
  { label: 'Low Stock', description: 'Balances below threshold', path: '/inventory/reports/low-stock', icon: TrendingDown },
  { label: 'Negative Stock', description: 'Balances with negative quantities', path: '/inventory/reports/negative-stock', icon: AlertTriangle },
  { label: 'Discrepancies', description: 'Transfer discrepancy records', path: '/inventory/reports/discrepancies', icon: Scale },
  { label: 'Reserved vs Available', description: 'Reserved vs available by SKU/site', path: '/inventory/reports/reserved-vs-available', icon: BarChart3 },
  { label: 'Recent Adjustments', description: 'Recently posted adjustments', path: '/inventory/reports/recent-adjustments', icon: ClipboardList },
  { label: 'Cycle Count Variance', description: 'Recount reconciliation variances', path: '/inventory/reports/cycle-count-variance', icon: RefreshCw },
];

export function ReportsIndexPage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Reports" description="Inventory analytical reports" breadcrumbs={[{ label: 'Inventory' }, { label: 'Reports' }]} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <SectionCard key={r.path}>
            <button className="flex w-full items-start gap-3 text-left" onClick={() => navigate(r.path)}>
              <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{r.label}</p>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </div>
            </button>
          </SectionCard>
        ))}
      </div>
    </>
  );
}

