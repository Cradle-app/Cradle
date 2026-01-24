/**
 * React hook for deploying ERC20 tokens
 */

import { useState, useCallback } from 'react';
import { getRpcEndpoint, getFactoryAddress, deployERC20TokenViaAPI } from '../deployment';
import type { 
  UseERC20DeployOptions, 
  UseERC20DeployReturn, 
  DeploymentState, 
  DeployTokenParams,
  DeployTokenResult,
} from '../types';

const DEFAULT_DEPLOYMENT_API_URL = 'http://localhost:4000';

export function useERC20Deploy(options: UseERC20DeployOptions): UseERC20DeployReturn {
  const { 
    privateKey, 
    rpcEndpoint, 
    network,
    deploymentApiUrl = DEFAULT_DEPLOYMENT_API_URL,
  } = options;

  const [deploymentState, setDeploymentState] = useState<DeploymentState>({ status: 'idle' });
  const [error, setError] = useState<Error | null>(null);

  const actualRpcEndpoint = rpcEndpoint || getRpcEndpoint(network);
  const factoryAddress = getFactoryAddress(network);

  const deployToken = useCallback(async (params: DeployTokenParams): Promise<DeployTokenResult> => {
    if (!privateKey) {
      throw new Error('Private key is required for deployment');
    }

    setError(null);
    setDeploymentState({ status: 'deploying' });

    try {
      // Deploy via API
      const result = await deployERC20TokenViaAPI({
        ...params,
        factoryAddress: params.factoryAddress || factoryAddress,
        privateKey,
        rpcEndpoint: actualRpcEndpoint,
        deploymentApiUrl,
      });

      setDeploymentState({ status: 'success', result });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setDeploymentState({ status: 'error', error });
      throw error;
    }
  }, [privateKey, actualRpcEndpoint, factoryAddress, deploymentApiUrl]);

  const reset = useCallback(() => {
    setDeploymentState({ status: 'idle' });
    setError(null);
  }, []);

  return {
    deployToken,
    deploymentState,
    isDeploying: deploymentState.status === 'deploying' || 
                 deploymentState.status === 'activating' ||
                 deploymentState.status === 'initializing' ||
                 deploymentState.status === 'registering',
    error,
    reset,
  };
}
