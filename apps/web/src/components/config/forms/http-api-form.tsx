'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { formStyles, labelStyles, inputStyles } from './shared-styles';

interface Props { nodeId: string; config: Record<string, unknown>; }

interface HeaderItem { key: string; value: string; }

export function HttpApiForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const update = (key: string, value: unknown) => updateNodeConfig(nodeId, { ...config, [key]: value });

  const headers = (config.headers as HeaderItem[]) ?? [];
  const method = (config.method as string) ?? 'GET';

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Method</label>
        <Select value={method} onValueChange={(v) => update('method', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>URL</label>
        <input
          className={inputStyles.base}
          value={(config.url as string) ?? ''}
          onChange={(e) => update('url', e.target.value)}
          placeholder="https://api.example.com/data"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Authentication</label>
        <Select value={(config.authType as string) ?? 'none'} onValueChange={(v) => update('authType', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="api-key">API Key</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Headers</label>
        <div className="space-y-2">
          {headers.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={inputStyles.base}
                value={h.key}
                onChange={(e) => {
                  const updated = headers.map((hdr, idx) => idx === i ? { ...hdr, key: e.target.value } : hdr);
                  update('headers', updated);
                }}
                placeholder="Key"
                style={{ flex: 1 }}
              />
              <input
                className={inputStyles.base}
                value={h.value}
                onChange={(e) => {
                  const updated = headers.map((hdr, idx) => idx === i ? { ...hdr, value: e.target.value } : hdr);
                  update('headers', updated);
                }}
                placeholder="Value"
                style={{ flex: 1 }}
              />
              <button
                onClick={() => update('headers', headers.filter((_, idx) => idx !== i))}
                className="p-1.5 rounded text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-error))] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => update('headers', [...headers, { key: '', value: '' }])}
          className="flex items-center gap-1.5 text-xs text-[hsl(var(--color-accent-primary))] hover:underline mt-1"
        >
          <Plus className="w-3 h-3" /> Add Header
        </button>
      </div>

      {method !== 'GET' && (
        <>
          <div className={formStyles.section}>
            <label className={labelStyles.base}>Body Type</label>
            <Select value={(config.bodyType as string) ?? 'none'} onValueChange={(v) => update('bodyType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="form">Form Data</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(config.bodyType as string) !== 'none' && (
            <div className={formStyles.section}>
              <label className={labelStyles.base}>Body</label>
              <textarea
                className={inputStyles.textarea}
                rows={4}
                value={(config.body as string) ?? ''}
                onChange={(e) => update('body', e.target.value)}
                placeholder='{"key": "value"}'
              />
            </div>
          )}
        </>
      )}

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Timeout (ms)</label>
        <input
          className={inputStyles.base}
          type="number"
          value={(config.timeout as number) ?? 30000}
          onChange={(e) => update('timeout', Number(e.target.value))}
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Retries</label>
        <input
          className={inputStyles.base}
          type="number"
          min={0}
          max={10}
          value={(config.retries as number) ?? 3}
          onChange={(e) => update('retries', Number(e.target.value))}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Server-side Proxy</span>
        <Switch
          checked={(config.generateProxy as boolean) ?? true}
          onCheckedChange={(v) => update('generateProxy', v)}
        />
      </div>
    </div>
  );
}
