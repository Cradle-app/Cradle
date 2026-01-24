'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shield, Terminal, AlertTriangle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/ui/code-block';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

const EXAMPLE_OUTPUT = `[ Low ] Unchecked Arithmetics found at:
 * /src/lib.rs:49:34-44

[i] radar completed successfully.
[i] Results written to output.json`;

const INSTALL_COMMAND = `curl -L https://raw.githubusercontent.com/auditware/radar/main/install-radar.sh | bash`;

const RUN_COMMAND = `radar -p .`;

export function AuditwareAnalyzingForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const outputFormat = (config.outputFormat as string) ?? 'both';
    const severityFilter = (config.severityFilter as string[]) ?? ['low', 'medium', 'high'];
    const projectPath = (config.projectPath as string) ?? '.';

    const toggleSeverity = (severity: string) => {
        const current = [...severityFilter];
        const index = current.indexOf(severity);
        if (index > -1) {
            if (current.length > 1) current.splice(index, 1);
        } else {
            current.push(severity);
        }
        updateConfig('severityFilter', current);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 rounded-lg border border-forge-border/50 bg-gradient-to-r from-accent-cyan/10 to-transparent">
                <Shield className="w-5 h-5 text-accent-cyan" />
                <div>
                    <h3 className="text-sm font-medium text-white">Auditware Analyzer</h3>
                    <p className="text-[11px] text-forge-muted">Security analysis with Radar</p>
                </div>
            </div>

            {/* What Radar Detects */}
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-white">Radar Detects</span>
                </div>
                <ul className="text-[10px] text-forge-muted space-y-1">
                    <li>• Unchecked arithmetic (overflow/underflow)</li>
                    <li>• Missing access controls</li>
                    <li>• Account validation problems</li>
                    <li>• Security best practice violations</li>
                </ul>
            </div>

            {/* Installation */}
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <Terminal className="w-3 h-3 text-forge-muted" />
                    <label className="text-xs text-forge-muted">Installation (Docker Required)</label>
                </div>
                <CodeBlock code={INSTALL_COMMAND} language="bash" maxHeight="60px" />
            </div>

            {/* Run Command */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Run Analysis</label>
                <CodeBlock code={RUN_COMMAND} language="bash" maxHeight="50px" />
            </div>

            {/* Output Format */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Output Format</label>
                <Select value={outputFormat} onValueChange={(v) => updateConfig('outputFormat', v)}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="console">Console Only</SelectItem>
                        <SelectItem value="json">JSON Only</SelectItem>
                        <SelectItem value="both">Both (Recommended)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Severity Filter */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Severity Filter</label>
                <div className="flex gap-2">
                    {[
                        { id: 'high', label: 'High', color: 'bg-red-500/20 border-red-500/50 text-red-400' },
                        { id: 'medium', label: 'Medium', color: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
                        { id: 'low', label: 'Low', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
                    ].map((sev) => (
                        <button
                            key={sev.id}
                            onClick={() => toggleSeverity(sev.id)}
                            className={cn(
                                'px-3 py-1.5 rounded text-xs font-medium border transition-all',
                                severityFilter.includes(sev.id) ? sev.color : 'bg-forge-bg border-forge-border text-forge-muted'
                            )}
                        >
                            {sev.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Project Path */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Project Path</label>
                <Input
                    type="text"
                    value={projectPath}
                    onChange={(e) => updateConfig('projectPath', e.target.value)}
                    placeholder="."
                    className="text-xs h-8 font-mono"
                />
            </div>

            {/* Example Output */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Example Output</label>
                <CodeBlock code={EXAMPLE_OUTPUT} language="bash" maxHeight="120px" showCopy={false} />
            </div>

            {/* Documentation Link */}
            <a
                href="https://github.com/auditware/radar"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg text-xs',
                    'border border-forge-border/30 bg-forge-elevated/50',
                    'hover:bg-forge-elevated hover:border-accent-cyan/30 transition-colors group'
                )}
            >
                <span className="text-white">Radar GitHub Repository</span>
                <ExternalLink className="w-3.5 h-3.5 text-forge-muted group-hover:text-accent-cyan" />
            </a>
        </div>
    );
}
