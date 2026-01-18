'use client';

import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useBlueprintStore } from '@/store/blueprint';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NETWORKS = [
  { chainId: 42161, name: 'Arbitrum One', isTestnet: false },
  { chainId: 421614, name: 'Arbitrum Sepolia', isTestnet: true },
  { chainId: 23011913, name: 'Arbitrum Stylus Testnet', isTestnet: true },
];

const LICENSES = ['MIT', 'Apache-2.0', 'GPL-3.0', 'UNLICENSED'];

export function ProjectSettingsDialog({ open, onOpenChange }: Props) {
  const { blueprint, updateConfig } = useBlueprintStore();
  const { project, network } = blueprint.config;

  const handleProjectChange = (key: string, value: unknown) => {
    updateConfig({
      project: { ...project, [key]: value },
    });
  };

  const handleNetworkChange = (chainId: number) => {
    const selectedNetwork = NETWORKS.find(n => n.chainId === chainId);
    if (selectedNetwork) {
      updateConfig({
        network: {
          chainId: selectedNetwork.chainId,
          name: selectedNetwork.name,
          isTestnet: selectedNetwork.isTestnet,
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forge-elevated flex items-center justify-center">
              <Settings className="w-4 h-4 text-forge-muted" />
            </div>
            Project Settings
          </DialogTitle>
          <DialogDescription>
            Configure your project metadata and target network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Project Information</h3>
            
            <Input
              label="Project Name"
              value={project.name}
              onChange={(e) => handleProjectChange('name', e.target.value)}
              placeholder="My Dapp"
            />

            <div>
              <label className="text-sm font-medium text-white mb-1.5 block">
                Description
              </label>
              <textarea
                value={project.description || ''}
                onChange={(e) => handleProjectChange('description', e.target.value)}
                placeholder="A brief description of your project..."
                className="w-full h-20 px-3 py-2 text-sm bg-forge-bg border border-forge-border rounded-lg text-white placeholder:text-forge-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Version"
                value={project.version}
                onChange={(e) => handleProjectChange('version', e.target.value)}
                placeholder="0.1.0"
              />

              <div>
                <Select
                  value={project.license}
                  onValueChange={(value) => handleProjectChange('license', value)}
                >
                  <SelectTrigger label="License">
                    <SelectValue placeholder="Select license" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSES.map((license) => (
                      <SelectItem key={license} value={license}>
                        {license}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Input
              label="Author"
              value={project.author || ''}
              onChange={(e) => handleProjectChange('author', e.target.value)}
              placeholder="Your Name"
            />
          </div>

          {/* Network */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Target Network</h3>
            
            <Select
              value={String(network.chainId)}
              onValueChange={(value) => handleNetworkChange(parseInt(value))}
            >
              <SelectTrigger label="Network">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.map((net) => (
                  <SelectItem key={net.chainId} value={String(net.chainId)}>
                    {net.name} {net.isTestnet && '(Testnet)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              label="Custom RPC URL (optional)"
              value={network.rpcUrl || ''}
              onChange={(e) => updateConfig({
                network: { ...network, rpcUrl: e.target.value },
              })}
              placeholder="https://..."
            />
          </div>

          {/* Generation Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Generation Options</h3>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
              <div>
                <p className="text-sm font-medium text-white">Generate Documentation</p>
                <p className="text-xs text-forge-muted">Create README and docs</p>
              </div>
              <Switch
                checked={blueprint.config.generateDocs}
                onCheckedChange={(checked) => updateConfig({ generateDocs: checked })}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

