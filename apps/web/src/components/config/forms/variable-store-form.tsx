'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formStyles, labelStyles, inputStyles } from './shared-styles';

interface Props { nodeId: string; config: Record<string, unknown>; }

export function VariableStoreForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const update = (key: string, value: unknown) => updateNodeConfig(nodeId, { ...config, [key]: value });

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Variable Name</label>
        <input
          className={inputStyles.base}
          value={(config.variableName as string) ?? 'myVariable'}
          onChange={(e) => update('variableName', e.target.value)}
          placeholder="myVariable"
          pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Type</label>
        <Select value={(config.variableType as string) ?? 'string'} onValueChange={(v) => update('variableType', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="object">Object</SelectItem>
            <SelectItem value="array">Array</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Default Value</label>
        <textarea
          className={inputStyles.textarea}
          rows={3}
          value={(config.defaultValue as string) ?? ''}
          onChange={(e) => update('defaultValue', e.target.value)}
          placeholder={
            (config.variableType as string) === 'object' ? '{"key": "value"}'
            : (config.variableType as string) === 'array' ? '["item1", "item2"]'
            : 'Default value'
          }
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Scope</label>
        <Select value={(config.scope as string) ?? 'local'} onValueChange={(v) => update('scope', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="local">Local (this workflow)</SelectItem>
            <SelectItem value="global">Global (shared)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
