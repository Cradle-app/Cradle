// Plugin initialization
import { getDefaultRegistry } from '@dapp-forge/plugin-sdk';
import { registerOfficialPlugins } from '@dapp-forge/plugins';

let initialized = false;

export function initializePlugins(): void {
  if (initialized) return;

  const registry = getDefaultRegistry();
  registerOfficialPlugins(registry);
  
  initialized = true;
  console.log('Initialized plugins:', registry.getAllIds().join(', '));
}

export { getDefaultRegistry };

