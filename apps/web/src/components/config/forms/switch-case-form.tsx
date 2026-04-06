'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { formStyles, labelStyles, inputStyles } from './shared-styles';

interface Props { nodeId: string; config: Record<string, unknown>; }

interface CaseItem { value: string; label: string; }

export function SwitchCaseForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const update = (key: string, value: unknown) => updateNodeConfig(nodeId, { ...config, [key]: value });

  const cases = (config.cases as CaseItem[]) ?? [{ value: '', label: 'Case 1' }];

  const addCase = () => {
    update('cases', [...cases, { value: '', label: `Case ${cases.length + 1}` }]);
  };

  const removeCase = (index: number) => {
    update('cases', cases.filter((_, i) => i !== index));
  };

  const updateCase = (index: number, field: 'value' | 'label', val: string) => {
    const updated = cases.map((c, i) => (i === index ? { ...c, [field]: val } : c));
    update('cases', updated);
  };

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Switch Expression</label>
        <input
          className={inputStyles.base}
          value={(config.switchExpression as string) ?? ''}
          onChange={(e) => update('switchExpression', e.target.value)}
          placeholder="e.g., data.type or response.status"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Cases</label>
        <div className="space-y-2">
          {cases.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={inputStyles.base}
                value={c.label}
                onChange={(e) => updateCase(i, 'label', e.target.value)}
                placeholder="Label"
                style={{ flex: 1 }}
              />
              <input
                className={inputStyles.base}
                value={c.value}
                onChange={(e) => updateCase(i, 'value', e.target.value)}
                placeholder="Match value"
                style={{ flex: 1 }}
              />
              {cases.length > 1 && (
                <button
                  onClick={() => removeCase(i)}
                  className="p-1.5 rounded text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-error))] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addCase}
          className="flex items-center gap-1.5 text-xs text-[hsl(var(--color-accent-primary))] hover:underline mt-1"
        >
          <Plus className="w-3 h-3" /> Add Case
        </button>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Include Default Case</span>
        <Switch
          checked={(config.hasDefault as boolean) ?? true}
          onCheckedChange={(v) => update('hasDefault', v)}
        />
      </div>
    </div>
  );
}
