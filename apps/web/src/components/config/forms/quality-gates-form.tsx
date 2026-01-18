'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const CI_PROVIDERS = [
  { value: 'github-actions', label: 'GitHub Actions' },
  { value: 'gitlab-ci', label: 'GitLab CI' },
  { value: 'circleci', label: 'CircleCI' },
];

const TEST_FRAMEWORKS = [
  { value: 'vitest', label: 'Vitest' },
  { value: 'jest', label: 'Jest' },
  { value: 'mocha', label: 'Mocha' },
];

const LINTERS = [
  { value: 'biome', label: 'Biome' },
  { value: 'eslint', label: 'ESLint' },
];

const FORMATTERS = [
  { value: 'biome', label: 'Biome' },
  { value: 'prettier', label: 'Prettier' },
];

export function QualityGatesForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* CI Provider */}
      <div>
        <Select
          value={(config.ciProvider as string) || 'github-actions'}
          onValueChange={(value) => handleChange('ciProvider', value)}
        >
          <SelectTrigger label="CI Provider">
            <SelectValue placeholder="Select CI provider" />
          </SelectTrigger>
          <SelectContent>
            {CI_PROVIDERS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Test Framework */}
      <div>
        <Select
          value={(config.testFramework as string) || 'vitest'}
          onValueChange={(value) => handleChange('testFramework', value)}
        >
          <SelectTrigger label="Test Framework">
            <SelectValue placeholder="Select test framework" />
          </SelectTrigger>
          <SelectContent>
            {TEST_FRAMEWORKS.map((framework) => (
              <SelectItem key={framework.value} value={framework.value}>
                {framework.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Linter */}
      <div>
        <Select
          value={(config.linter as string) || 'biome'}
          onValueChange={(value) => handleChange('linter', value)}
        >
          <SelectTrigger label="Linter">
            <SelectValue placeholder="Select linter" />
          </SelectTrigger>
          <SelectContent>
            {LINTERS.map((linter) => (
              <SelectItem key={linter.value} value={linter.value}>
                {linter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Formatter */}
      <div>
        <Select
          value={(config.formatter as string) || 'biome'}
          onValueChange={(value) => handleChange('formatter', value)}
        >
          <SelectTrigger label="Formatter">
            <SelectValue placeholder="Select formatter" />
          </SelectTrigger>
          <SelectContent>
            {FORMATTERS.map((formatter) => (
              <SelectItem key={formatter.value} value={formatter.value}>
                {formatter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Coverage Threshold */}
      <div>
        <Input
          label="Coverage Threshold (%)"
          type="number"
          min={0}
          max={100}
          value={(config.coverageThreshold as number) || 80}
          onChange={(e) => handleChange('coverageThreshold', parseInt(e.target.value))}
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
          <div>
            <p className="text-sm font-medium text-white">Type Checking</p>
            <p className="text-xs text-forge-muted">Enable TypeScript checks</p>
          </div>
          <Switch
            checked={(config.typecheck as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('typecheck', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
          <div>
            <p className="text-sm font-medium text-white">Pre-commit Hooks</p>
            <p className="text-xs text-forge-muted">Husky + lint-staged</p>
          </div>
          <Switch
            checked={(config.preCommitHooks as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('preCommitHooks', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
          <div>
            <p className="text-sm font-medium text-white">Security Scanning</p>
            <p className="text-xs text-forge-muted">Vulnerability checks</p>
          </div>
          <Switch
            checked={(config.securityScanning as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('securityScanning', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
          <div>
            <p className="text-sm font-medium text-white">Dependency Audit</p>
            <p className="text-xs text-forge-muted">npm audit integration</p>
          </div>
          <Switch
            checked={(config.dependencyAudit as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('dependencyAudit', checked)}
          />
        </div>
      </div>
    </div>
  );
}

