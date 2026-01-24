'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Box, ExternalLink, FileCode, Github, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/ui/code-block';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

// Template contracts
const TEMPLATES: Record<string, { code: string; source?: string }> = {
    counter: {
        source: 'https://github.com/abhi152003/speedrun_stylus/blob/counter/packages/stylus-demo/src/lib.rs',
        code: `//!
//! Stylus Hello World
//!
//! The following contract implements the Counter example from Foundry.
//!

// Allow \`cargo stylus export-abi\` to generate a main function.
#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::U256, prelude::*};

// Define some persistent storage using the Solidity ABI.
// \`Counter\` will be the entrypoint.
sol_storage! {
    #[entrypoint]
    pub struct Counter {
        uint256 number;
    }
}

/// Declare that \`Counter\` is a contract with the following external methods.
#[public]
impl Counter {
    /// Gets the number from storage.
    pub fn number(&self) -> U256 {
        self.number.get()
    }

    /// Sets a number in storage to a user-specified value.
    pub fn set_number(&mut self, new_number: U256) {
        self.number.set(new_number);
    }

    /// Sets a number in storage to a user-specified value.
    pub fn mul_number(&mut self, new_number: U256) {
        self.number.set(new_number * self.number.get());
    }

    /// Sets a number in storage to a user-specified value.
    pub fn add_number(&mut self, new_number: U256) {
        self.number.set(new_number + self.number.get());
    }

    /// Increments \`number\` and updates its value in storage.
    pub fn increment(&mut self) {
        let number = self.number.get();
        self.set_number(number + U256::from(1));
    }
}`,
    },
    'vending-machine': {
        source: 'https://github.com/abhi152003/speedrun_stylus/blob/vending-machine/packages/cargo-stylus/vending_machine/src/lib.rs',
        code: `//!
//! Stylus Cupcake Example
//!

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use alloy_primitives::{Address, Uint};
use stylus_sdk::alloy_primitives::U256;
use stylus_sdk::prelude::*;
use stylus_sdk::{block, console};

sol_storage! {
    #[entrypoint]
    pub struct VendingMachine {
        mapping(address => uint256) cupcake_balances;
        mapping(address => uint256) cupcake_distribution_times;
    }
}

#[public]
impl VendingMachine {
    pub fn give_cupcake_to(&mut self, user_address: Address) -> bool {
        let last_distribution = self.cupcake_distribution_times.get(user_address);
        let five_seconds_from_last_distribution = last_distribution + U256::from(5);
        let current_time = block::timestamp();
        let user_can_receive_cupcake =
            five_seconds_from_last_distribution <= Uint::<256, 4>::from(current_time);

        if user_can_receive_cupcake {
            let mut balance_accessor = self.cupcake_balances.setter(user_address);
            let balance = balance_accessor.get() + U256::from(1);
            balance_accessor.set(balance);

            let mut time_accessor = self.cupcake_distribution_times.setter(user_address);
            let new_distribution_time = block::timestamp();
            time_accessor.set(Uint::<256, 4>::from(new_distribution_time));
            return true;
        } else {
            console!(
                "HTTP 429: Too Many Cupcakes (wait at least 5 seconds between cupcakes)"
            );
            return false;
        }
    }

    pub fn get_cupcake_balance_for(&self, user_address: Address) -> Uint<256, 4> {
        return self.cupcake_balances.get(user_address);
    }
}`,
    },
    erc20: {
        code: `// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Stylus ^0.3.0

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use openzeppelin_stylus::token::erc20::extensions::burnable::IErc20Burnable;
use openzeppelin_stylus::token::erc20::{self, Erc20, IErc20};
use stylus_sdk::alloy_primitives::{Address, U256};
use stylus_sdk::prelude::*;

#[entrypoint]
#[storage]
struct MyToken {
    erc20: Erc20,
}

#[public]
#[implements(IErc20<Error = erc20::Error>, IErc20Burnable<Error = erc20::Error>)]
impl MyToken {}

#[public]
impl IErc20 for MyToken {
    type Error = erc20::Error;

    fn total_supply(&self) -> U256 {
        self.erc20.total_supply()
    }

    fn balance_of(&self, account: Address) -> U256 {
        self.erc20.balance_of(account)
    }

    fn transfer(&mut self, to: Address, value: U256) -> Result<bool, Self::Error> {
        Ok(self.erc20.transfer(to, value)?)
    }

    fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.erc20.allowance(owner, spender)
    }

    fn approve(&mut self, spender: Address, value: U256) -> Result<bool, Self::Error> {
        Ok(self.erc20.approve(spender, value)?)
    }

    fn transfer_from(&mut self, from: Address, to: Address, value: U256) -> Result<bool, Self::Error> {
        Ok(self.erc20.transfer_from(from, to, value)?)
    }
}

#[public]
impl IErc20Burnable for MyToken {
    type Error = erc20::Error;

    fn burn(&mut self, value: U256) -> Result<(), Self::Error> {
        Ok(self.erc20.burn(value)?)
    }

    fn burn_from(&mut self, account: Address, value: U256) -> Result<(), Self::Error> {
        Ok(self.erc20.burn_from(account, value)?)
    }
}`,
    },
    erc721: {
        code: `// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Stylus ^0.3.0

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use openzeppelin_stylus::token::erc721::extensions::burnable::IErc721Burnable;
use openzeppelin_stylus::token::erc721::{self, Erc721, IErc721};
use openzeppelin_stylus::utils::introspection::erc165::IErc165;
use stylus_sdk::abi::Bytes;
use stylus_sdk::alloy_primitives::{Address, FixedBytes, U256};
use stylus_sdk::prelude::*;

#[entrypoint]
#[storage]
struct MyToken {
    erc721: Erc721,
}

#[public]
#[implements(IErc721<Error = erc721::Error>, IErc721Burnable<Error = erc721::Error>, IErc165)]
impl MyToken {}

#[public]
impl IErc721 for MyToken {
    type Error = erc721::Error;

    fn balance_of(&self, owner: Address) -> Result<U256, Self::Error> {
        Ok(self.erc721.balance_of(owner)?)
    }

    fn owner_of(&self, token_id: U256) -> Result<Address, Self::Error> {
        Ok(self.erc721.owner_of(token_id)?)
    }

    fn safe_transfer_from(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.safe_transfer_from(from, to, token_id)?)
    }

    #[selector(name = "safeTransferFrom")]
    fn safe_transfer_from_with_data(&mut self, from: Address, to: Address, token_id: U256, data: Bytes) -> Result<(), Self::Error> {
        Ok(self.erc721.safe_transfer_from_with_data(from, to, token_id, data)?)
    }

    fn transfer_from(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.transfer_from(from, to, token_id)?)
    }

    fn approve(&mut self, to: Address, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.approve(to, token_id)?)
    }

    fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Self::Error> {
        Ok(self.erc721.set_approval_for_all(operator, approved)?)
    }

    fn get_approved(&self, token_id: U256) -> Result<Address, Self::Error> {
        Ok(self.erc721.get_approved(token_id)?)
    }

    fn is_approved_for_all(&self, owner: Address, operator: Address) -> bool {
        self.erc721.is_approved_for_all(owner, operator)
    }
}

#[public]
impl IErc721Burnable for MyToken {
    type Error = erc721::Error;

    fn burn(&mut self, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.burn(token_id)?)
    }
}

#[public]
impl IErc165 for MyToken {
    fn supports_interface(&self, interface_id: FixedBytes<4>) -> bool {
        self.erc721.supports_interface(interface_id)
    }
}`,
    },
    erc1155: {
        code: `// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Stylus ^0.3.0

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use openzeppelin_stylus::token::erc1155::extensions::{
    Erc1155Supply, IErc1155Burnable, IErc1155Supply
};
use openzeppelin_stylus::token::erc1155::{self, IErc1155};
use openzeppelin_stylus::utils::introspection::erc165::IErc165;
use stylus_sdk::abi::Bytes;
use stylus_sdk::alloy_primitives::{Address, FixedBytes, U256};
use stylus_sdk::prelude::*;

#[entrypoint]
#[storage]
struct MyToken {
    erc1155_supply: Erc1155Supply,
}

#[public]
#[implements(IErc1155<Error = erc1155::Error>, IErc1155Burnable<Error = erc1155::Error>, IErc1155Supply, IErc165)]
impl MyToken {}

#[public]
impl IErc1155 for MyToken {
    type Error = erc1155::Error;

    fn balance_of(&self, account: Address, id: U256) -> U256 {
        self.erc1155_supply.balance_of(account, id)
    }

    fn balance_of_batch(&self, accounts: Vec<Address>, ids: Vec<U256>) -> Result<Vec<U256>, Self::Error> {
        Ok(self.erc1155_supply.balance_of_batch(accounts, ids)?)
    }

    fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply.set_approval_for_all(operator, approved)?)
    }

    fn is_approved_for_all(&self, account: Address, operator: Address) -> bool {
        self.erc1155_supply.is_approved_for_all(account, operator)
    }

    fn safe_transfer_from(&mut self, from: Address, to: Address, id: U256, value: U256, data: Bytes) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply.safe_transfer_from(from, to, id, value, data)?)
    }

    fn safe_batch_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        ids: Vec<U256>,
        values: Vec<U256>,
        data: Bytes,
    ) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply.safe_batch_transfer_from(from, to, ids, values, data)?)
    }
}

#[public]
impl IErc1155Burnable for MyToken {
    type Error = erc1155::Error;

    fn burn(&mut self, account: Address, token_id: U256, value: U256) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply._burn(account, token_id, value)?)
    }

    fn burn_batch(&mut self, account: Address, token_ids: Vec<U256>, values: Vec<U256>) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply._burn_batch(account, token_ids, values)?)
    }
}

#[public]
impl IErc1155Supply for MyToken {
    fn total_supply(&self, id: U256) -> U256 {
        self.erc1155_supply.total_supply(id)
    }

    #[selector(name = "totalSupply")]
    fn total_supply_all(&self) -> U256 {
        self.erc1155_supply.total_supply_all()
    }

    fn exists(&self, id: U256) -> bool {
        self.erc1155_supply.exists(id)
    }
}

#[public]
impl IErc165 for MyToken {
    fn supports_interface(&self, interface_id: FixedBytes<4>) -> bool {
        self.erc1155_supply.supports_interface(interface_id)
    }
}`,
    },
    storage: {
        code: `sol_storage! {
    #[entrypoint]
    pub struct Storage {
        mapping(address => uint256) balances;
    }
}

#[public]
impl Storage {
    pub fn get_balance(&self, addr: Address) -> U256 {
        self.balances.get(addr)
    }

    pub fn set_balance(&mut self, addr: Address, value: U256) {
        self.balances.insert(addr, value);
    }
}`,
    },
};

const TEMPLATE_OPTIONS = [
    { value: 'counter', label: 'Counter' },
    { value: 'vending-machine', label: 'Vending Machine' },
    { value: 'erc20', label: 'ERC-20 Token' },
    { value: 'erc721', label: 'ERC-721 NFT' },
    { value: 'erc1155', label: 'ERC-1155 Multi-Token' },
    { value: 'storage', label: 'Storage Mapping' },
    { value: 'custom', label: 'Custom Contract' },
];

export function StylusRustContractForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const exampleType = (config.exampleType as string) ?? 'counter';
    const contractCode = (config.contractCode as string) ?? '';

    const isCustom = exampleType === 'custom';
    const template = TEMPLATES[exampleType];
    const displayCode = isCustom ? contractCode : (template?.code ?? '');

    const handleTemplateChange = (value: string) => {
        // Update both values in a single batch to prevent stale state
        const newConfig: Record<string, unknown> = { ...config, exampleType: value };
        if (value !== 'custom') {
            // Clear custom code when switching to a template
            newConfig.contractCode = '';
        }
        updateNodeConfig(nodeId, newConfig);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 rounded-lg border border-forge-border/50 bg-gradient-to-r from-accent-cyan/10 to-transparent">
                <Box className="w-5 h-5 text-accent-cyan" />
                <div>
                    <h3 className="text-sm font-medium text-white">Stylus Rust Contract</h3>
                    <p className="text-[11px] text-forge-muted">Build Rust smart contracts for Arbitrum</p>
                </div>
            </div>

            {/* Template Selection */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">Contract Template</label>
                <Select 
                    key={`template-select-${nodeId}`}
                    value={exampleType} 
                    onValueChange={handleTemplateChange}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                        {TEMPLATE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Custom Code Input */}
            {isCustom && (
                <div>
                    <label className="text-xs text-forge-muted mb-1.5 block">Your Contract Code</label>
                    <Textarea
                        value={contractCode}
                        onChange={(e) => updateConfig('contractCode', e.target.value)}
                        placeholder="Paste your Stylus Rust contract code here..."
                        className="min-h-[200px] font-mono text-xs"
                    />
                </div>
            )}

            {/* Code Preview */}
            {displayCode && (
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-forge-muted">
                            {isCustom ? 'Code Preview' : 'Template Preview'}
                        </label>
                        <FileCode className="w-3 h-3 text-forge-muted" />
                    </div>
                    <CodeBlock code={displayCode} language="rust" maxHeight="300px" />
                </div>
            )}

            {/* OpenZeppelin Contracts Info */}
            <div className="p-3 rounded-lg border border-accent-cyan/30 bg-gradient-to-br from-accent-cyan/5 to-transparent">
                <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Github className="w-4 h-4 text-accent-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Info className="w-3 h-3 text-accent-cyan" />
                            <span className="text-xs font-medium text-white">Need More Contracts?</span>
                        </div>
                        <p className="text-[10px] text-forge-muted leading-relaxed mb-2">
                            For custom contracts or additional templates, check out OpenZeppelin's official 
                            Rust contracts library for Arbitrum Stylus - featuring security-audited implementations 
                            of ERC-20, ERC-721, ERC-1155, and more.
                        </p>
                        <a
                            href="https://github.com/OpenZeppelin/rust-contracts-stylus"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium',
                                'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30',
                                'hover:bg-accent-cyan/20 hover:border-accent-cyan/50 transition-all group'
                            )}
                        >
                            <Github className="w-3 h-3" />
                            <span>OpenZeppelin Rust Contracts</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Documentation Link */}
            <a
                href="https://docs.arbitrum.io/stylus/quickstart"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg text-xs',
                    'border border-forge-border/30 bg-forge-elevated/50',
                    'hover:bg-forge-elevated hover:border-accent-cyan/30 transition-colors group'
                )}
            >
                <span className="text-white">Arbitrum Stylus Documentation</span>
                <ExternalLink className="w-3.5 h-3.5 text-forge-muted group-hover:text-accent-cyan" />
            </a>
        </div>
    );
}
