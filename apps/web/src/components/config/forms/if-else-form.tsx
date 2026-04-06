'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formStyles, labelStyles, inputStyles } from './shared-styles';

interface Props { nodeId: string; config: Record<string, unknown>; }

export function IfElseForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const update = (key: string, value: unknown) => updateNodeConfig(nodeId, { ...config, [key]: value });

  const conditionType = (config.conditionType as string) ?? 'value-compare';

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Condition Type</label>
        <Select value={conditionType} onValueChange={(v) => update('conditionType', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="value-compare">Value Compare</SelectItem>
            <SelectItem value="expression">Expression</SelectItem>
            <SelectItem value="exists">Exists Check</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {conditionType === 'expression' && (
        <div className={formStyles.section}>
          <label className={labelStyles.base}>Expression</label>
          <textarea
            className={inputStyles.textarea}
            rows={3}
            value={(config.condition as string) ?? ''}
            onChange={(e) => update('condition', e.target.value)}
            placeholder="e.g., data.status === 'active' && data.count > 0"
          />
        </div>
      )}

      {conditionType === 'value-compare' && (
        <>
          <div className={formStyles.section}>
            <label className={labelStyles.base}>Operator</label>
            <Select
              value={(config.compareOperator as string) ?? 'eq'}
              onValueChange={(v) => update('compareOperator', v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="eq">Equals (==)</SelectItem>
                <SelectItem value="neq">Not Equals (!=)</SelectItem>
                <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
                <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                <SelectItem value="gte">Greater or Equal (&gt;=)</SelectItem>
                <SelectItem value="lte">Less or Equal (&lt;=)</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="startsWith">Starts With</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={formStyles.section}>
            <label className={labelStyles.base}>Compare Value</label>
            <input
              className={inputStyles.base}
              value={(config.compareValue as string) ?? ''}
              onChange={(e) => update('compareValue', e.target.value)}
              placeholder="Value to compare against"
            />
          </div>
        </>
      )}
    </div>
  );
}
