import { useState } from 'react';
import { Trash2, Edit, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHeader,
  SectionCard,
  DetailPanel,
  TabbedDetailLayout,
  Toolbar,
  SearchInput,
  DataTable,
  StatusBadge,
  AutoStatusBadge,
  PermissionBadge,
  AALBadge,
  ConfirmDialog,
  FormDialog,
  FormField,
  ActionMenu,
  PaginationFooter,
  EventTimeline,
  NotFoundState,
  ForbiddenState,
  InsufficientAALState,
  ErrorState,
} from '@/components/common';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import type { Column } from '@/components/common/data-table';

interface DemoRow {
  id: string;
  name: string;
  status: string;
  role: string;
}

const demoData: DemoRow[] = [
  { id: '1', name: 'Alice Johnson', status: 'active', role: 'Admin' },
  { id: '2', name: 'Bob Smith', status: 'pending', role: 'Operator' },
  { id: '3', name: 'Carol Lee', status: 'suspended', role: 'Viewer' },
];

const columns: Column<DemoRow>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name },
  { id: 'status', header: 'Status', cell: (r) => <AutoStatusBadge status={r.status} /> },
  { id: 'role', header: 'Role', cell: (r) => r.role },
  {
    id: 'actions',
    header: '',
    cell: () => (
      <ActionMenu
        actions={[
          { label: 'View', icon: Eye, onClick: () => {} },
          { label: 'Edit', icon: Edit, onClick: () => {} },
          { label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'destructive', separator: true },
        ]}
      />
    ),
    className: 'w-12',
  },
];

const demoEvents = [
  { id: '1', title: 'User created', description: 'Account provisioned by admin', timestamp: '2025-01-15 09:30' },
  { id: '2', title: 'Role assigned', description: 'Assigned "Operator" role', timestamp: '2025-01-15 09:35' },
  { id: '3', title: 'Password changed', timestamp: '2025-01-20 14:00' },
];

type Section = 'layout' | 'badges' | 'table' | 'dialogs' | 'states' | 'timeline';

export function ComponentLibraryPage() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('layout');

  const sections: { id: Section; label: string }[] = [
    { id: 'layout', label: 'Layout' },
    { id: 'badges', label: 'Badges' },
    { id: 'table', label: 'Table' },
    { id: 'dialogs', label: 'Dialogs' },
    { id: 'states', label: 'States' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div>
      <PageHeader
        title="Component Library"
        description="Internal preview of reusable HELIOS components"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Component Library' }]}
      />

      <div className="mb-6 flex gap-2">
        {sections.map((s) => (
          <Button
            key={s.id}
            variant={activeSection === s.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {activeSection === 'layout' && (
        <div className="space-y-6">
          <SectionCard title="Section Card" description="A bordered card for grouping content">
            <DetailPanel
              fields={[
                { label: 'Name', value: 'HELIOS System' },
                { label: 'Version', value: '1.0.0' },
                { label: 'Environment', value: 'Development' },
                { label: 'Uptime', value: '14 days' },
              ]}
            />
          </SectionCard>

          <SectionCard title="Tabbed Layout">
            <TabbedDetailLayout
              tabs={[
                { id: 'overview', label: 'Overview', content: <p className="text-sm text-muted-foreground">Overview content</p> },
                { id: 'config', label: 'Configuration', content: <p className="text-sm text-muted-foreground">Config content</p> },
                { id: 'audit', label: 'Audit Log', content: <p className="text-sm text-muted-foreground">Audit content</p> },
              ]}
            />
          </SectionCard>

          <SectionCard title="Toolbar with Search">
            <Toolbar>
              <SearchInput value={search} onChange={setSearch} placeholder="Filter items…" className="w-64" />
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Item</Button>
            </Toolbar>
          </SectionCard>

          <SectionCard title="Form Field">
            <div className="max-w-sm space-y-4">
              <FormField label="Username" htmlFor="demo-user" required>
                <Input id="demo-user" placeholder="Enter username" />
              </FormField>
              <FormField label="Email" htmlFor="demo-email" error="Invalid email address">
                <Input id="demo-email" placeholder="Enter email" />
              </FormField>
            </div>
          </SectionCard>
        </div>
      )}

      {activeSection === 'badges' && (
        <SectionCard title="Badges">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Status Badges</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="Default" />
                <StatusBadge label="Active" variant="success" />
                <StatusBadge label="Pending" variant="warning" />
                <StatusBadge label="Failed" variant="destructive" />
                <StatusBadge label="Draft" variant="secondary" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Auto Status Badges</p>
              <div className="flex flex-wrap gap-2">
                {['active', 'pending', 'draft', 'suspended', 'completed', 'unknown'].map((s) => (
                  <AutoStatusBadge key={s} status={s} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Permission Badges</p>
              <div className="flex flex-wrap gap-2">
                <PermissionBadge permission="inventory:read" />
                <PermissionBadge permission="iam:users:write" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">AAL Badges</p>
              <div className="flex flex-wrap gap-2">
                <AALBadge level={1} />
                <AALBadge level={2} />
                <AALBadge level={3} />
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {activeSection === 'table' && (
        <SectionCard title="Data Table" noPadding>
          <DataTable columns={columns} data={demoData} keyField="id" />
          <PaginationFooter page={1} pageSize={10} total={3} onPageChange={() => {}} />
        </SectionCard>
      )}

      {activeSection === 'dialogs' && (
        <SectionCard title="Dialogs">
          <div className="flex gap-3">
            <ConfirmDialog
              trigger={<Button variant="destructive" size="sm">Delete Item</Button>}
              title="Delete Item?"
              description="This action cannot be undone."
              confirmLabel="Delete"
              variant="destructive"
              onConfirm={() => new Promise((r) => setTimeout(r, 1000))}
            />
            <FormDialog
              trigger={<Button size="sm"><Plus className="mr-1 h-4 w-4" /> Create Item</Button>}
              title="Create New Item"
            >
              {({ close }) => (
                <div className="space-y-4">
                  <FormField label="Name" htmlFor="dlg-name" required>
                    <Input id="dlg-name" placeholder="Enter name" />
                  </FormField>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={close}>Cancel</Button>
                    <Button onClick={close}>Create</Button>
                  </div>
                </div>
              )}
            </FormDialog>
          </div>
        </SectionCard>
      )}

      {activeSection === 'states' && (
        <div className="space-y-6">
          <SectionCard title="Loading"><PageLoading /></SectionCard>
          <SectionCard title="Empty"><EmptyState title="No items" description="Create your first item to get started." /></SectionCard>
          <SectionCard title="Error"><ErrorState onRetry={() => {}} /></SectionCard>
          <SectionCard title="Not Found"><NotFoundState noun="item" /></SectionCard>
          <SectionCard title="Forbidden"><ForbiddenState /></SectionCard>
          <SectionCard title="Insufficient AAL"><InsufficientAALState requiredLevel={2} /></SectionCard>
        </div>
      )}

      {activeSection === 'timeline' && (
        <SectionCard title="Event Timeline">
          <EventTimeline events={demoEvents} />
        </SectionCard>
      )}
    </div>
  );
}

