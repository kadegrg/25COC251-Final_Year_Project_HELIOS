import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import { Building2, Warehouse, MapPin, GitBranch } from 'lucide-react';

const sections = [
  { label: 'Sites', description: 'Manage inventory sites', href: '/inventory/structure/sites', icon: Building2 },
  { label: 'Warehouses', description: 'Manage warehouses within sites', href: '/inventory/structure/warehouses', icon: Warehouse },
  { label: 'Locations', description: 'Manage storage locations', href: '/inventory/structure/locations', icon: MapPin },
  { label: 'Location Tree', description: 'Hierarchical location view', href: '/inventory/structure/locations/tree', icon: GitBranch },
];

export function InventoryStructurePage() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Inventory Structure" description="Sites, warehouses, and locations" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div
            key={s.href}
            className="rounded-lg border bg-card text-card-foreground p-6 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(s.href)}
          >
            <div className="flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{s.label}</p>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



