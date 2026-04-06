'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formStyles, labelStyles, inputStyles } from './shared-styles';

interface Props { nodeId: string; config: Record<string, unknown>; }

export function LoopIteratorForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const update = (key: string, value: unknown) => updateNodeConfig(nodeId, { ...config, [key]: value });

  const loopType = (config.loopType as string) ?? 'for-each';

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Loop Type</label>
        <Select value={loopType} onValueChange={(v) => update('loopType', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="for-each">For Each (iterate array)</SelectItem>
            <SelectItem value="count">Count (repeat N times)</SelectItem>
            <SelectItem value="while">While (condition loop)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loopType === 'for-each' && (
        <div className={formStyles.section}>
          <label className={labelStyles.base}>Iterable Expression</label>
          <input
            className={inputStyles.base}
            value={(config.iterableExpression as string) ?? ''}
            onChange={(e) => update('iterableExpression', e.target.value)}
            placeholder="e.g., data.items or response.results"
          />
        </div>
      )}

      {loopType === 'count' && (
        <div className={formStyles.section}>
          <label className={labelStyles.base}>Count</label>
          <input
            className={inputStyles.base}
            type="number"
            min={0}
            value={(config.count as number) ?? 10}
            onChange={(e) => update('count', Number(e.target.value))}
          />
        </div>
      )}

      {loopType === 'while' && (
        <div className={formStyles.section}>
          <label className={labelStyles.base}>While Condition</label>
          <input
            className={inputStyles.base}
            value={(config.iterableExpression as string) ?? ''}
            onChange={(e) => update('iterableExpression', e.target.value)}
            placeholder="e.g., counter < 100"
          />
        </div>
      )}

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Max Iterations (safety limit)</label>
        <input
          className={inputStyles.base}
          type="number"
          min={1}
          max={100000}
          value={(config.maxIterations as number) ?? 1000}
          onChange={(e) => update('maxIterations', Number(e.target.value))}
        />
      </div>
    </div>
  );
}
