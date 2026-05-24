import { useState } from 'react';
import { SectionCard } from '@/components/common/section-card';
import { QueryResult } from '@/components/common/query-result';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/auth/guards';
import { usePluginConfig, useUpdatePluginConfig } from '@/hooks/use-plugins';
import { PLUGIN_PERMISSIONS } from '@/types/plugins.types';
import { parseApiError } from '@/lib/api-errors';
import { Pencil, Save, X } from 'lucide-react';

export function PluginConfigSection({ pluginId }: { pluginId: string }) {
  const q = usePluginConfig(pluginId);
  const updateMut = useUpdatePluginConfig();
  const [editing, setEditing] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const startEdit = () => {
    setJsonText(JSON.stringify(q.data?.config ?? {}, null, 2));
    setValidationError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setValidationError(null);
  };

  const saveConfig = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      setValidationError(null);
      await updateMut.mutateAsync({ pluginId, body: { config: parsed } });
      setEditing(false);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setValidationError('Invalid JSON: ' + err.message);
      } else {
        const apiErr = parseApiError(err);
        setValidationError(apiErr.message);
      }
    }
  };

  return (
    <QueryResult isLoading={q.isLoading} error={q.error} data={q.data} notFoundNoun="config">
      {q.data && (
        <SectionCard
          title="Configuration"
          description={q.data.configVersion ? `Version: ${q.data.configVersion}` : undefined}
          actions={
            <PermissionGate permission={PLUGIN_PERMISSIONS.configUpdate}>
              {!editing ? (
                <Button size="sm" variant="outline" onClick={startEdit}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={cancelEdit} disabled={updateMut.isPending}>
                    <X className="mr-1 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveConfig} disabled={updateMut.isPending}>
                    <Save className="mr-1 h-3.5 w-3.5" />
                    {updateMut.isPending ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              )}
            </PermissionGate>
          }
        >
          {editing ? (
            <div>
              <textarea
                className="w-full min-h-[200px] rounded-md border bg-muted/50 p-3 font-mono text-sm"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
              {validationError && (
                <p className="mt-2 text-sm text-destructive">{validationError}</p>
              )}
            </div>
          ) : (
            <pre className="rounded-md bg-muted/50 p-3 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(q.data.config, null, 2)}
            </pre>
          )}
        </SectionCard>
      )}
    </QueryResult>
  );
}

