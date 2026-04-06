'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formStyles, labelStyles, inputStyles } from './shared-styles';

interface Props { nodeId: string; config: Record<string, unknown>; }

export function TransformForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const update = (key: string, value: unknown) => updateNodeConfig(nodeId, { ...config, [key]: value });

  const transformType = (config.transformType as string) ?? 'template';

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Transform Type</label>
        <Select value={transformType} onValueChange={(v) => update('transformType', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="template">Template (Mustache-style)</SelectItem>
            <SelectItem value="jsonpath">JSON Path</SelectItem>
            <SelectItem value="javascript">JavaScript Expression</SelectItem>
            <SelectItem value="jq">jq Filter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>
          {transformType === 'template' ? 'Template' : transformType === 'jsonpath' ? 'JSON Path' : transformType === 'javascript' ? 'JavaScript' : 'jq Filter'}
        </label>
        <textarea
          className={inputStyles.textarea}
          rows={4}
          value={(config.transformExpression as string) ?? ''}
          onChange={(e) => update('transformExpression', e.target.value)}
          placeholder={
            transformType === 'template' ? 'Hello {{name}}, your total is {{order.total}}'
            : transformType === 'jsonpath' ? 'data.items[0].name'
            : transformType === 'javascript' ? 'input.items.map(i => i.name).join(", ")'
            : '.data.items[] | .name'
          }
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Input Mapping</label>
        <input
          className={inputStyles.base}
          value={(config.inputMapping as string) ?? ''}
          onChange={(e) => update('inputMapping', e.target.value)}
          placeholder="Path to input data (e.g., response.data)"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Output Format</label>
        <Select value={(config.outputFormat as string) ?? 'json'} onValueChange={(v) => update('outputFormat', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="text">Plain Text</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
