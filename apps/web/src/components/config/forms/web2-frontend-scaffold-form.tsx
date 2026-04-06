'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formStyles, labelStyles, inputStyles } from './shared-styles';

interface Props { nodeId: string; config: Record<string, unknown>; }

export function Web2FrontendScaffoldForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const update = (key: string, value: unknown) => updateNodeConfig(nodeId, { ...config, [key]: value });

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>App Name</label>
        <input
          className={inputStyles.base}
          value={(config.appName as string) ?? 'My App'}
          onChange={(e) => update('appName', e.target.value)}
          placeholder="My App"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>App Description</label>
        <input
          className={inputStyles.base}
          value={(config.appDescription as string) ?? ''}
          onChange={(e) => update('appDescription', e.target.value)}
          placeholder="A brief description of your app"
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Styling</label>
        <Select value={(config.styling as string) ?? 'tailwind'} onValueChange={(v) => update('styling', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tailwind">Tailwind CSS</SelectItem>
            <SelectItem value="css-modules">CSS Modules</SelectItem>
            <SelectItem value="vanilla">Vanilla CSS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>State Management</label>
        <Select value={(config.stateManagement as string) ?? 'tanstack-query'} onValueChange={(v) => update('stateManagement', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tanstack-query">TanStack Query</SelectItem>
            <SelectItem value="zustand">Zustand</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Auth Provider</label>
        <Select value={(config.authProvider as string) ?? 'none'} onValueChange={(v) => update('authProvider', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="nextauth">NextAuth.js</SelectItem>
            <SelectItem value="clerk">Clerk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Router</label>
        <Select value={(config.projectStructure as string) ?? 'app-router'} onValueChange={(v) => update('projectStructure', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="app-router">App Router</SelectItem>
            <SelectItem value="pages-router">Pages Router</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Dark Mode Support</span>
        <Switch
          checked={(config.darkModeSupport as boolean) ?? true}
          onCheckedChange={(v) => update('darkModeSupport', v)}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">src/ Directory</span>
        <Switch
          checked={(config.srcDirectory as boolean) ?? true}
          onCheckedChange={(v) => update('srcDirectory', v)}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Strict TypeScript</span>
        <Switch
          checked={(config.strictMode as boolean) ?? true}
          onCheckedChange={(v) => update('strictMode', v)}
        />
      </div>
    </div>
  );
}
