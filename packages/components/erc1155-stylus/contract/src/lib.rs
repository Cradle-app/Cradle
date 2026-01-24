// SPDX-License-Identifier: MIT
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
}
