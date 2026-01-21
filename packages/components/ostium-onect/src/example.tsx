'use client';

/**
 * Example: Ostium One-Click Trading Setup
 * 
 * This example shows how to use the useDelegation and useUsdcApproval hooks
 * to enable one-click trading on Ostium.
 * 
 * Prerequisites:
 * - Install wagmi and viem: pnpm add wagmi viem @tanstack/react-query
 * - Configure wagmi provider in your app
 */

import { useDelegation, useUsdcApproval, CONTRACTS, CHAIN_IDS } from './index';
// Import from wagmi when using this example:
// import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

// Network configuration - change to 'arbitrum-sepolia' for testnet
const network = 'arbitrum' as const;

/**
 * Example component showing how to set up Ostium one-click trading.
 * 
 * Usage:
 * 1. Wrap your app with wagmi's WagmiProvider
 * 2. Import and use this component
 * 
 * @example
 * ```tsx
 * import { OstiumSetupExample } from '@cradle/ostium-onect/example';
 * 
 * function App() {
 *   return (
 *     <WagmiProvider config={config}>
 *       <OstiumSetupExample />
 *     </WagmiProvider>
 *   );
 * }
 * ```
 */
export function OstiumSetupExample() {
    // In your actual implementation, use wagmi hooks:
    // const { address } = useAccount();
    // const publicClient = usePublicClient({ chainId: CHAIN_IDS[network] });
    // const { data: walletClient } = useWalletClient({ chainId: CHAIN_IDS[network] });

    // For this example, we use placeholder values
    const address = '0x...' as `0x${string}`;
    const publicClient = null as any;
    const walletClient = null as any;

    const delegation = useDelegation({
        publicClient: publicClient!,
        walletClient: walletClient ?? undefined,
        network,
        userAddress: address,
        delegateAddress: undefined, // Set your delegate address here
    });

    const approval = useUsdcApproval({
        publicClient: publicClient!,
        walletClient: walletClient ?? undefined,
        network,
        userAddress: address,
    });

    return (
        <div className="ostium-setup">
            <h2>Ostium One-Click Trading Setup</h2>

            <section>
                <h3>Step 1: Enable Delegation</h3>
                <p>Status: {delegation.status?.isDelegated ? 'Active ✓' : 'Not Active'}</p>
                {!delegation.status?.isDelegated && (
                    <button
                        onClick={() => delegation.enable()}
                        disabled={delegation.isLoading}
                    >
                        {delegation.isLoading ? 'Enabling...' : 'Enable Delegation'}
                    </button>
                )}
                {delegation.error && <p className="error">{String(delegation.error)}</p>}
            </section>

            <section>
                <h3>Step 2: Approve USDC</h3>
                <p>
                    Status: {approval.status?.hasApproval
                        ? `Approved: ${approval.status.formattedAllowance} USDC ✓`
                        : 'Not Approved'}
                </p>
                {!approval.status?.hasApproval && (
                    <button
                        onClick={() => approval.approve()}
                        disabled={approval.isLoading}
                    >
                        {approval.isLoading ? 'Approving...' : 'Approve USDC'}
                    </button>
                )}
                {approval.error && <p className="error">{String(approval.error)}</p>}
            </section>

            <section>
                <h3>Contract Info</h3>
                <dl>
                    <dt>Trading Contract:</dt>
                    <dd><code>{CONTRACTS[network].trading}</code></dd>
                    <dt>Storage Contract:</dt>
                    <dd><code>{CONTRACTS[network].storage}</code></dd>
                    <dt>USDC Contract:</dt>
                    <dd><code>{CONTRACTS[network].usdc}</code></dd>
                </dl>
            </section>
        </div>
    );
}
