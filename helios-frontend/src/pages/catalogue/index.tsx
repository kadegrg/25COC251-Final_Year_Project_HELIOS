import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { Tags, Box, Layers } from 'lucide-react';

const sections = [
  { label: 'Categories', description: 'Manage product categories', href: '/inventory/catalogue/categories', icon: Layers },
  { label: 'Attributes', description: 'Manage attribute definitions', href: '/inventory/catalogue/attributes', icon: Tags },
  { label: 'SKUs', description: 'Manage product SKUs', href: '/inventory/catalogue/skus', icon: Box },
];

export function CatalogueIndexPage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Catalogue" description="Product definitions, categories, and attributes" />
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <SectionCard key={s.href}>
            <button className="flex w-full items-start gap-3 text-left" onClick={() => navigate(s.href)}>
              <s.icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{s.label}</p>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            </button>
          </SectionCard>
        ))}
      </div>
    </>
  );
}

