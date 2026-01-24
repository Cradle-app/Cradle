// SPDX-License-Identifier: MIT
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
}
