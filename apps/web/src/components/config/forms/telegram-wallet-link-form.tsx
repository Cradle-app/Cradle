'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

export function TelegramWalletLinkForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Persistence Type</label>
                <Select
                    value={(config.persistenceType as string) ?? 'prisma'}
                    onValueChange={(v) => updateConfig('persistenceType', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="prisma">Prisma ORM</SelectItem>
                        <SelectItem value="drizzle">Drizzle ORM</SelectItem>
                        <SelectItem value="in-memory">In-Memory (Testing)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm text-white">Signature Verification</span>
                <Switch
                    checked={(config.verificationEnabled as boolean) ?? true}
                    onCheckedChange={(v) => updateConfig('verificationEnabled', v)}
                />
            </div>
        </div>
    );
}
