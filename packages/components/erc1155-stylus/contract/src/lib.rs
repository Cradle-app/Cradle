//! # ERC-1155 Stylus Multi-Token Contract
//!
//! A feature-rich ERC-1155 multi-token implementation for Arbitrum Stylus.
//!
//! ## Features
//! - **Ownable**: Owner-controlled contract management
//! - **Mintable**: Owner can mint new tokens (single or batch)
//! - **Burnable**: Token holders can burn their tokens
//! - **Pausable**: Owner can pause/unpause transfers
//! - **Supply Tracking**: Track total supply per token ID
//! - **URI Management**: Flexible metadata URI system
//!
//! ## Deployment
//! ```bash
//! # Install cargo-stylus
//! cargo install cargo-stylus
//!
//! # Build the contract
//! cargo stylus check
//!
//! # Deploy to Arbitrum Sepolia
//! cargo stylus deploy --private-key <YOUR_PRIVATE_KEY> --endpoint https://sepolia-rollup.arbitrum.io/rpc
//! ```

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    alloy_sol_types::sol,
    evm, msg,
    prelude::*,
};

// Solidity-style events and errors
sol! {
    // ERC-1155 Events
    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);
    
    // Ownership Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Pausable Events
    event Paused(address account);
    event Unpaused(address account);
    
    // Errors
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);
    error ERC1155InvalidSender(address sender);
    error ERC1155InvalidReceiver(address receiver);
    error ERC1155MissingApprovalForAll(address operator, address owner);
    error ERC1155InvalidOperator(address operator);
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
    error UnauthorizedAccount(address account);
    error EnforcedPause();
    error ExpectedPause();
}

// Storage layout for the ERC-1155 multi-token
sol_storage! {
    #[entrypoint]
    pub struct ERC1155Token {
        // Token metadata URI template
        string base_uri;
        
        // Token balances: account => id => balance
        mapping(address => mapping(uint256 => uint256)) balances;
        
        // Operator approvals: owner => operator => approved
        mapping(address => mapping(address => bool)) operator_approvals;
        
        // Total supply per token ID
        mapping(uint256 => uint256) total_supply;
        
        // Token existence tracking
        mapping(uint256 => bool) token_exists;
        
        // Ownable
        address owner;
        
        // Pausable
        bool paused;
        
        // Initialization flag
        bool initialized;
        
        // Next token ID for auto-incrementing
        uint256 next_token_id;
    }
}

/// ERC-1155 Multi-Token Interface
#[public]
impl ERC1155Token {
    // ============================================
    // Initialization
    // ============================================

    /// Initialize the contract with base URI and owner
    pub fn initialize(
        &mut self,
        base_uri: String,
        owner: Address,
    ) -> Result<(), Vec<u8>> {
        if self.initialized.get() {
            return Err("Already initialized".into());
        }
        
        self.base_uri.set_str(&base_uri);
        self.owner.set(owner);
        self.paused.set(false);
        self.next_token_id.set(U256::from(1)); // Start token IDs at 1
        self.initialized.set(true);
        
        evm::log(OwnershipTransferred {
            previousOwner: Address::ZERO,
            newOwner: owner,
        });
        
        Ok(())
    }

    // ============================================
    // ERC-1155 Standard Functions
    // ============================================

    /// Returns the URI for a token ID
    pub fn uri(&self, id: U256) -> String {
        let base = self.base_uri.get_string();
        format!("{}{}.json", base, id)
    }

    /// Returns the balance of an account's tokens for a specific ID
    pub fn balance_of(&self, account: Address, id: U256) -> Result<U256, Vec<u8>> {
        if account == Address::ZERO {
            return Err(ERC1155InvalidSender { sender: account }.encode().into());
        }
        Ok(self.balances.get(account).get(id))
    }

    /// Returns the balances of multiple account/ID pairs
    pub fn balance_of_batch(
        &self,
        accounts: Vec<Address>,
        ids: Vec<U256>,
    ) -> Result<Vec<U256>, Vec<u8>> {
        if accounts.len() != ids.len() {
            return Err(ERC1155InvalidArrayLength {
                idsLength: U256::from(ids.len()),
                valuesLength: U256::from(accounts.len()),
            }.encode().into());
        }
        
        let mut balances = Vec::with_capacity(accounts.len());
        for i in 0..accounts.len() {
            if accounts[i] == Address::ZERO {
                return Err(ERC1155InvalidSender { sender: accounts[i] }.encode().into());
            }
            balances.push(self.balances.get(accounts[i]).get(ids[i]));
        }
        Ok(balances)
    }

    /// Sets or revokes approval for an operator to transfer all tokens
    pub fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Vec<u8>> {
        let owner = msg::sender();
        if operator == Address::ZERO {
            return Err(ERC1155InvalidOperator { operator }.encode().into());
        }
        if operator == owner {
            return Err("Cannot set approval for self".into());
        }
        
        self.operator_approvals.setter(owner).setter(operator).set(approved);
        evm::log(ApprovalForAll { account: owner, operator, approved });
        Ok(())
    }

    /// Returns true if operator is approved to transfer account's tokens
    pub fn is_approved_for_all(&self, account: Address, operator: Address) -> bool {
        self.operator_approvals.get(account).get(operator)
    }

    /// Transfers amount of token ID from one address to another
    pub fn safe_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        id: U256,
        amount: U256,
        _data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        self.require_not_paused()?;
        
        let operator = msg::sender();
        if from != operator && !self.is_approved_for_all(from, operator) {
            return Err(ERC1155MissingApprovalForAll { operator, owner: from }.encode().into());
        }
        
        self.transfer_internal(operator, from, to, id, amount)?;
        Ok(())
    }

    /// Batch transfers multiple token IDs from one address to another
    pub fn safe_batch_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        ids: Vec<U256>,
        amounts: Vec<U256>,
        _data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        self.require_not_paused()?;
        
        if ids.len() != amounts.len() {
            return Err(ERC1155InvalidArrayLength {
                idsLength: U256::from(ids.len()),
                valuesLength: U256::from(amounts.len()),
            }.encode().into());
        }
        
        let operator = msg::sender();
        if from != operator && !self.is_approved_for_all(from, operator) {
            return Err(ERC1155MissingApprovalForAll { operator, owner: from }.encode().into());
        }
        
        self.batch_transfer_internal(operator, from, to, ids, amounts)?;
        Ok(())
    }

    // ============================================
    // Mintable Functions (Owner Only)
    // ============================================

    /// Mint tokens to an address (owner only)
    pub fn mint(
        &mut self,
        to: Address,
        id: U256,
        amount: U256,
        _data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        self.require_not_paused()?;
        self.mint_internal(to, id, amount)
    }

    /// Mint a new token type with auto-incremented ID (owner only)
    pub fn mint_new(&mut self, to: Address, amount: U256) -> Result<U256, Vec<u8>> {
        self.require_owner()?;
        self.require_not_paused()?;
        
        let id = self.next_token_id.get();
        self.next_token_id.set(id + U256::from(1));
        self.mint_internal(to, id, amount)?;
        Ok(id)
    }

    /// Batch mint multiple tokens (owner only)
    pub fn mint_batch(
        &mut self,
        to: Address,
        ids: Vec<U256>,
        amounts: Vec<U256>,
        _data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        self.require_not_paused()?;
        
        if ids.len() != amounts.len() {
            return Err(ERC1155InvalidArrayLength {
                idsLength: U256::from(ids.len()),
                valuesLength: U256::from(amounts.len()),
            }.encode().into());
        }
        
        self.batch_mint_internal(to, ids, amounts)
    }

    // ============================================
    // Burnable Functions
    // ============================================

    /// Burn tokens from caller's balance
    pub fn burn(&mut self, id: U256, amount: U256) -> Result<(), Vec<u8>> {
        self.require_not_paused()?;
        let from = msg::sender();
        self.burn_internal(from, id, amount)
    }

    /// Burn tokens from an address (must be owner or approved)
    pub fn burn_from(
        &mut self,
        from: Address,
        id: U256,
        amount: U256,
    ) -> Result<(), Vec<u8>> {
        self.require_not_paused()?;
        
        let operator = msg::sender();
        if from != operator && !self.is_approved_for_all(from, operator) {
            return Err(ERC1155MissingApprovalForAll { operator, owner: from }.encode().into());
        }
        
        self.burn_internal(from, id, amount)
    }

    /// Batch burn multiple tokens
    pub fn burn_batch(
        &mut self,
        ids: Vec<U256>,
        amounts: Vec<U256>,
    ) -> Result<(), Vec<u8>> {
        self.require_not_paused()?;
        
        if ids.len() != amounts.len() {
            return Err(ERC1155InvalidArrayLength {
                idsLength: U256::from(ids.len()),
                valuesLength: U256::from(amounts.len()),
            }.encode().into());
        }
        
        let from = msg::sender();
        self.batch_burn_internal(from, ids, amounts)
    }

    // ============================================
    // Supply Tracking
    // ============================================

    /// Returns the total supply of a token ID
    pub fn total_supply(&self, id: U256) -> U256 {
        self.total_supply.get(id)
    }

    /// Returns whether a token ID exists (has been minted)
    pub fn exists(&self, id: U256) -> bool {
        self.token_exists.get(id)
    }

    // ============================================
    // Pausable Functions (Owner Only)
    // ============================================

    /// Pause token transfers (owner only)
    pub fn pause(&mut self) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        self.require_not_paused()?;
        self.paused.set(true);
        evm::log(Paused {
            account: msg::sender(),
        });
        Ok(())
    }

    /// Unpause token transfers (owner only)
    pub fn unpause(&mut self) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        self.require_paused()?;
        self.paused.set(false);
        evm::log(Unpaused {
            account: msg::sender(),
        });
        Ok(())
    }

    /// Check if the contract is paused
    pub fn is_paused(&self) -> bool {
        self.paused.get()
    }

    // ============================================
    // Ownable Functions
    // ============================================

    /// Returns the current owner
    pub fn owner(&self) -> Address {
        self.owner.get()
    }

    /// Update the base URI (owner only)
    pub fn set_uri(&mut self, new_uri: String) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        self.base_uri.set_str(&new_uri);
        // Emit URI event for token ID 0 to indicate global change
        evm::log(URI {
            value: new_uri,
            id: U256::ZERO,
        });
        Ok(())
    }

    /// Transfer ownership to a new address (owner only)
    pub fn transfer_ownership(&mut self, new_owner: Address) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        if new_owner == Address::ZERO {
            return Err("New owner is zero address".into());
        }
        let old_owner = self.owner.get();
        self.owner.set(new_owner);
        evm::log(OwnershipTransferred {
            previousOwner: old_owner,
            newOwner: new_owner,
        });
        Ok(())
    }

    /// Renounce ownership (owner only)
    pub fn renounce_ownership(&mut self) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        let old_owner = self.owner.get();
        self.owner.set(Address::ZERO);
        evm::log(OwnershipTransferred {
            previousOwner: old_owner,
            newOwner: Address::ZERO,
        });
        Ok(())
    }

    // ============================================
    // ERC-165 Interface Detection
    // ============================================

    /// Check if the contract supports an interface
    pub fn supports_interface(&self, interface_id: [u8; 4]) -> bool {
        // ERC165: 0x01ffc9a7
        // ERC1155: 0xd9b67a26
        // ERC1155MetadataURI: 0x0e89341c
        matches!(
            interface_id,
            [0x01, 0xff, 0xc9, 0xa7] |  // ERC165
            [0xd9, 0xb6, 0x7a, 0x26] |  // ERC1155
            [0x0e, 0x89, 0x34, 0x1c]    // ERC1155MetadataURI
        )
    }
}

// Internal functions
impl ERC1155Token {
    fn require_owner(&self) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(UnauthorizedAccount {
                account: msg::sender(),
            }.encode().into());
        }
        Ok(())
    }

    fn require_not_paused(&self) -> Result<(), Vec<u8>> {
        if self.paused.get() {
            return Err(EnforcedPause {}.encode().into());
        }
        Ok(())
    }

    fn require_paused(&self) -> Result<(), Vec<u8>> {
        if !self.paused.get() {
            return Err(ExpectedPause {}.encode().into());
        }
        Ok(())
    }

    fn transfer_internal(
        &mut self,
        operator: Address,
        from: Address,
        to: Address,
        id: U256,
        amount: U256,
    ) -> Result<(), Vec<u8>> {
        if from == Address::ZERO {
            return Err(ERC1155InvalidSender { sender: from }.encode().into());
        }
        if to == Address::ZERO {
            return Err(ERC1155InvalidReceiver { receiver: to }.encode().into());
        }

        let from_balance = self.balances.get(from).get(id);
        if from_balance < amount {
            return Err(ERC1155InsufficientBalance {
                sender: from,
                balance: from_balance,
                needed: amount,
                tokenId: id,
            }.encode().into());
        }

        self.balances.setter(from).setter(id).set(from_balance - amount);
        let to_balance = self.balances.get(to).get(id);
        self.balances.setter(to).setter(id).set(to_balance + amount);

        evm::log(TransferSingle {
            operator,
            from,
            to,
            id,
            value: amount,
        });
        Ok(())
    }

    fn batch_transfer_internal(
        &mut self,
        operator: Address,
        from: Address,
        to: Address,
        ids: Vec<U256>,
        amounts: Vec<U256>,
    ) -> Result<(), Vec<u8>> {
        if from == Address::ZERO {
            return Err(ERC1155InvalidSender { sender: from }.encode().into());
        }
        if to == Address::ZERO {
            return Err(ERC1155InvalidReceiver { receiver: to }.encode().into());
        }

        for i in 0..ids.len() {
            let id = ids[i];
            let amount = amounts[i];

            let from_balance = self.balances.get(from).get(id);
            if from_balance < amount {
                return Err(ERC1155InsufficientBalance {
                    sender: from,
                    balance: from_balance,
                    needed: amount,
                    tokenId: id,
                }.encode().into());
            }

            self.balances.setter(from).setter(id).set(from_balance - amount);
            let to_balance = self.balances.get(to).get(id);
            self.balances.setter(to).setter(id).set(to_balance + amount);
        }

        evm::log(TransferBatch {
            operator,
            from,
            to,
            ids,
            values: amounts,
        });
        Ok(())
    }

    fn mint_internal(&mut self, to: Address, id: U256, amount: U256) -> Result<(), Vec<u8>> {
        if to == Address::ZERO {
            return Err(ERC1155InvalidReceiver { receiver: to }.encode().into());
        }

        let balance = self.balances.get(to).get(id);
        self.balances.setter(to).setter(id).set(balance + amount);

        let supply = self.total_supply.get(id);
        self.total_supply.setter(id).set(supply + amount);
        self.token_exists.setter(id).set(true);

        evm::log(TransferSingle {
            operator: msg::sender(),
            from: Address::ZERO,
            to,
            id,
            value: amount,
        });
        Ok(())
    }

    fn batch_mint_internal(
        &mut self,
        to: Address,
        ids: Vec<U256>,
        amounts: Vec<U256>,
    ) -> Result<(), Vec<u8>> {
        if to == Address::ZERO {
            return Err(ERC1155InvalidReceiver { receiver: to }.encode().into());
        }

        for i in 0..ids.len() {
            let id = ids[i];
            let amount = amounts[i];

            let balance = self.balances.get(to).get(id);
            self.balances.setter(to).setter(id).set(balance + amount);

            let supply = self.total_supply.get(id);
            self.total_supply.setter(id).set(supply + amount);
            self.token_exists.setter(id).set(true);
        }

        evm::log(TransferBatch {
            operator: msg::sender(),
            from: Address::ZERO,
            to,
            ids,
            values: amounts,
        });
        Ok(())
    }

    fn burn_internal(&mut self, from: Address, id: U256, amount: U256) -> Result<(), Vec<u8>> {
        if from == Address::ZERO {
            return Err(ERC1155InvalidSender { sender: from }.encode().into());
        }

        let balance = self.balances.get(from).get(id);
        if balance < amount {
            return Err(ERC1155InsufficientBalance {
                sender: from,
                balance,
                needed: amount,
                tokenId: id,
            }.encode().into());
        }

        self.balances.setter(from).setter(id).set(balance - amount);

        let supply = self.total_supply.get(id);
        self.total_supply.setter(id).set(supply - amount);

        evm::log(TransferSingle {
            operator: msg::sender(),
            from,
            to: Address::ZERO,
            id,
            value: amount,
        });
        Ok(())
    }

    fn batch_burn_internal(
        &mut self,
        from: Address,
        ids: Vec<U256>,
        amounts: Vec<U256>,
    ) -> Result<(), Vec<u8>> {
        if from == Address::ZERO {
            return Err(ERC1155InvalidSender { sender: from }.encode().into());
        }

        for i in 0..ids.len() {
            let id = ids[i];
            let amount = amounts[i];

            let balance = self.balances.get(from).get(id);
            if balance < amount {
                return Err(ERC1155InsufficientBalance {
                    sender: from,
                    balance,
                    needed: amount,
                    tokenId: id,
                }.encode().into());
            }

            self.balances.setter(from).setter(id).set(balance - amount);

            let supply = self.total_supply.get(id);
            self.total_supply.setter(id).set(supply - amount);
        }

        evm::log(TransferBatch {
            operator: msg::sender(),
            from,
            to: Address::ZERO,
            ids,
            values: amounts,
        });
        Ok(())
    }
}
