'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formStyles, labelStyles, inputStyles } from './shared-styles';

interface Props { nodeId: string; config: Record<string, unknown>; }

export function DelayTimerForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const update = (key: string, value: unknown) => updateNodeConfig(nodeId, { ...config, [key]: value });

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Delay Type</label>
        <Select value={(config.delayType as string) ?? 'fixed'} onValueChange={(v) => update('delayType', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Duration</SelectItem>
            <SelectItem value="expression">Dynamic Expression</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Duration</label>
        <div className="flex items-center gap-2">
          <input
            className={inputStyles.base}
            type="number"
            min={0}
            value={(config.delayMs as number) ?? 1000}
            onChange={(e) => update('delayMs', Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <Select value={(config.unit as string) ?? 'seconds'} onValueChange={(v) => update('unit', v)}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ms">ms</SelectItem>
              <SelectItem value="seconds">seconds</SelectItem>
              <SelectItem value="minutes">minutes</SelectItem>
              <SelectItem value="hours">hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
