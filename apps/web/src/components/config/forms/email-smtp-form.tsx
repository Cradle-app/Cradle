'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formStyles, labelStyles, inputStyles } from './shared-styles';

interface Props { nodeId: string; config: Record<string, unknown>; }

export function EmailSmtpForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const update = (key: string, value: unknown) => updateNodeConfig(nodeId, { ...config, [key]: value });

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Provider</label>
        <Select value={(config.provider as string) ?? 'resend'} onValueChange={(v) => update('provider', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="resend">Resend</SelectItem>
            <SelectItem value="sendgrid">SendGrid</SelectItem>
            <SelectItem value="ses">AWS SES</SelectItem>
            <SelectItem value="smtp">Custom SMTP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>From Name</label>
        <input
          className={inputStyles.base}
          value={(config.fromName as string) ?? ''}
          onChange={(e) => update('fromName', e.target.value)}
          placeholder="My App"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>From Email</label>
        <input
          className={inputStyles.base}
          value={(config.fromEmail as string) ?? ''}
          onChange={(e) => update('fromEmail', e.target.value)}
          placeholder="noreply@example.com"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>To</label>
        <input
          className={inputStyles.base}
          value={(config.to as string) ?? ''}
          onChange={(e) => update('to', e.target.value)}
          placeholder="recipient@example.com"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Subject</label>
        <input
          className={inputStyles.base}
          value={(config.subject as string) ?? ''}
          onChange={(e) => update('subject', e.target.value)}
          placeholder="Email subject line"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Body Format</label>
        <Select value={(config.bodyFormat as string) ?? 'html'} onValueChange={(v) => update('bodyFormat', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="text">Plain Text</SelectItem>
            <SelectItem value="markdown">Markdown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Body Template</label>
        <textarea
          className={inputStyles.textarea}
          rows={5}
          value={(config.bodyTemplate as string) ?? ''}
          onChange={(e) => update('bodyTemplate', e.target.value)}
          placeholder="<h1>Hello {{name}}</h1><p>Your order is ready.</p>"
        />
      </div>
    </div>
  );
}
