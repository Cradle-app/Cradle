# Zero-Knowledge Contracts in DappForge

DappForge now supports generating privacy-preserving smart contracts with Zero-Knowledge (ZK) proof verification on Arbitrum Stylus.

## Overview

The Stylus ZK Contract plugin generates:
- **ZK Circuits** (Circom) - Privacy-preserving proof generation
- **Stylus Contracts** (Rust/WASM) - On-chain proof verification
- **Oracle Service** - Secure balance/ownership verification
- **Frontend Integration** - Proof generation and minting utilities

## Inspiration

This feature is inspired by [thirdweb's Stylus ZK ERC721 template](https://blog.thirdweb.com/changelog/new-stylus-template-zk-based-token-contracts/), which demonstrates privacy-preserving token contracts using Zero-Knowledge proofs.

## Circuit Types

### 1. Balance Proof Circuit

Proves a user owns a minimum amount of ETH/tokens without revealing the exact balance.

**Use Case**: Mint tokens by proving you have sufficient balance privately.

**Private Inputs:**
- `actual_balance`: User's real balance (hidden)
- `salt`: Randomness for uniqueness

**Public Inputs:**
- `min_required_balance`: Minimum threshold
- `user_address_hash`: Hashed user address
- `timestamp`: When oracle signed data
- `oracle_commitment`: Oracle's commitment

### 2. Ownership Proof Circuit

Proves ownership of specific tokens without revealing which tokens.

**Use Case**: Prove you own tokens from a collection without revealing which ones.

### 3. Custom Circuit

Define your own ZK circuit logic for custom privacy requirements.

## Generated Components

### ZK Circuit (Circom)

Located in `circuits/{contract-name}/`:
- Circuit definition (`.circom`)
- Compiled WASM and R1CS files
- Verification keys (zkey)

### Stylus Contract (Rust)

Located in `contracts/{contract-name}/`:
- Rust contract with Groth16 proof verification
- Nullifier system (prevents replay attacks)
- Standard ERC721/ERC20/ERC1155 functions

### Oracle Service

Located in `services/oracle/`:
- Fastify API for balance verification
- Secure commitment generation
- Signed data endpoints

### Frontend Integration

Located in `src/lib/zk/`:
- Proof generation utilities
- Contract interaction helpers
- Complete minting flow

## Usage Example

```typescript
import { mintTokenWithZKProof } from '@/lib/zk/privacy-token-zk';

// Mint a token by proving you have sufficient balance
const txHash = await mintTokenWithZKProof(
  walletClient,
  userAddress,
  '1000000000000000000' // 1 ETH minimum
);
```

## Security Considerations

1. **Oracle Secret**: Keep the oracle secret key secure
2. **Nullifier Replay**: Prevents proof reuse
3. **Circuit Audit**: Audit circuits before production
4. **Trusted Setup**: Perform Groth16 trusted setup securely

## Dependencies

- **Circom**: ZK circuit compiler
- **snarkjs**: Proof generation and verification
- **arkworks**: Elliptic curve operations (for production)
- **Rust + Stylus SDK**: Contract compilation

## References

- [thirdweb Stylus ZK Template](https://blog.thirdweb.com/changelog/new-stylus-template-zk-based-token-contracts/)
- [Arbitrum Stylus Documentation](https://docs.arbitrum.io/stylus)
- [Circom Documentation](https://docs.circom.io/)
- [Groth16 Protocol](https://eprint.iacr.org/2016/260.pdf)

