import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { EmailSmtpConfig } from '@dapp-forge/blueprint-schema';

export class EmailSmtpPlugin extends BasePlugin<z.infer<typeof EmailSmtpConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'email-smtp',
    name: 'Email',
    version: '0.1.0',
    description: 'Send emails via SMTP or services (SendGrid, Resend, SES)',
    category: 'app',
    tags: ['email', 'smtp', 'sendgrid', 'resend', 'notification', 'web2'],
  };

  readonly configSchema = EmailSmtpConfig as unknown as z.ZodType<z.infer<typeof EmailSmtpConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'email-in', name: 'Trigger', type: 'input', dataType: 'config' },
    { id: 'email-out', name: 'Result', type: 'output', dataType: 'config' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof EmailSmtpConfig>> {
    return {
      provider: 'resend',
      to: '',
      subject: '',
      bodyTemplate: '',
      bodyFormat: 'html',
      fromName: '',
      fromEmail: '',
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext,
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();
    const shortId = node.id.slice(0, 8);
    const routeName = `email-send-${shortId}`;

    this.addFile(output, 'email-sender.ts', generateEmailSender(config, routeName), 'frontend-lib');
    this.addFile(output, 'types.ts', generateTypes(), 'frontend-types');
    this.addFile(output, `${routeName}/route.ts`, generateApiRoute(config), 'backend-routes');

    if (config.provider === 'resend') {
      this.addEnvVar(output, 'RESEND_API_KEY', 'Resend API key for sending emails', { required: true });
    } else if (config.provider === 'sendgrid') {
      this.addEnvVar(output, 'SENDGRID_API_KEY', 'SendGrid API key', { required: true });
    } else if (config.provider === 'ses') {
      this.addEnvVar(output, 'AWS_ACCESS_KEY_ID', 'AWS access key for SES', { required: true });
      this.addEnvVar(output, 'AWS_SECRET_ACCESS_KEY', 'AWS secret key for SES', { required: true });
      this.addEnvVar(output, 'AWS_REGION', 'AWS region for SES', { required: true });
    } else {
      this.addEnvVar(output, 'SMTP_HOST', 'SMTP server hostname', { required: true });
      this.addEnvVar(output, 'SMTP_PORT', 'SMTP server port', { required: true });
      this.addEnvVar(output, 'SMTP_USER', 'SMTP username', { required: true });
      this.addEnvVar(output, 'SMTP_PASS', 'SMTP password', { required: true });
    }

    this.addScript(output, 'email:test', 'tsx src/lib/email/test-send.ts');
    this.addDoc(output, `docs/logic/email-${shortId}.md`, 'Email Block', generateDocs(config, routeName));

    context.logger.info('Generated email sender', { nodeId: node.id, provider: config.provider });
    return output;
  }
}

function generateTypes(): string {
  return `export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  bodyFormat: 'html' | 'text' | 'markdown';
  from?: { name: string; email: string };
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
`;
}

function generateEmailSender(config: z.infer<typeof EmailSmtpConfig>, routeName: string): string {
  if (config.provider === 'resend') {
    return `import type { EmailOptions, EmailResult } from '../types/types';

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY not configured' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: \`\${options.from?.name ?? '${config.fromName || 'App'}'} <\${options.from?.email ?? '${config.fromEmail || 'noreply@example.com'}'}>\`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        [options.bodyFormat === 'text' ? 'text' : 'html']: options.body,
        reply_to: options.replyTo,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: (err as Record<string, string>).message ?? res.statusText };
    }

    const data = await res.json() as { id: string };
    return { success: true, messageId: data.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send email' };
  }
}
`;
  }

  return `import type { EmailOptions, EmailResult } from '../types/types';

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const res = await fetch('/api/${routeName}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    const data = await res.json() as EmailResult;
    return data;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send email' };
  }
}
`;
}

function generateApiRoute(config: z.infer<typeof EmailSmtpConfig>): string {
  if (config.provider === 'resend') {
    return `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const body = await request.json() as {
      to: string | string[];
      subject: string;
      body: string;
      bodyFormat?: 'html' | 'text' | 'markdown';
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: '${config.fromName || 'App'} <${config.fromEmail || 'noreply@example.com'}>',
        to: Array.isArray(body.to) ? body.to : [body.to],
        subject: body.subject,
        [(body.bodyFormat ?? '${config.bodyFormat}') === 'text' ? 'text' : 'html']: body.body,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ success: false, error: (err as Record<string, string>).message ?? res.statusText }, { status: 500 });
    }

    const data = await res.json() as { id: string };
    return NextResponse.json({ success: true, messageId: data.id });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
`;
  }

  return `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      to: string | string[];
      subject: string;
      body: string;
      bodyFormat?: 'html' | 'text' | 'markdown';
    };

    // TODO: Implement ${config.provider} email sending
    // Configure your ${config.provider} provider credentials in .env
    return NextResponse.json(
      { success: false, error: '${config.provider} provider not yet configured — implement in this file' },
      { status: 501 },
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
`;
}

function generateDocs(config: z.infer<typeof EmailSmtpConfig>, routeName: string): string {
  return `# Email Block

Send emails using ${config.provider}.

## Configuration
- **Provider**: ${config.provider}
- **Format**: ${config.bodyFormat}
- **API Route**: \`/api/${routeName}\`

## Setup

1. Set the required environment variable(s) for your provider.
2. Use the \`sendEmail\` function or hit the \`/api/${routeName}\` endpoint.

## Usage

\`\`\`typescript
import { sendEmail } from '@/lib/email-smtp/lib/email-sender';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  body: '<h1>Hello World</h1>',
  bodyFormat: 'html',
});
\`\`\`
`;
}
