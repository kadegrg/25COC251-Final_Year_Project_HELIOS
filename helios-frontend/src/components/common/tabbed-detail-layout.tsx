import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabbedDetailLayoutProps {
  tabs: TabDef[];
  defaultTab?: string;
}

export function TabbedDetailLayout({ tabs, defaultTab }: TabbedDetailLayoutProps) {
  return (
    <Tabs defaultValue={defaultTab ?? tabs[0]?.id} className="mt-4">
      <TabsList>
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.id} value={t.id} className="mt-4">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

