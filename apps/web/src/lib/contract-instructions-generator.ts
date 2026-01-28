'use client';

/**
 * Contract Instructions Generator
 * 
 * Generates markdown instruction files based on user's function selections
 * for ERC Stylus contracts. These instructions can be passed to an LLM
 * along with the lib.rs file to generate modified contract code.
 */

// Function metadata for each contract type
const ERC20_FUNCTIONS = {
    mint: {
        name: 'mint',
        signature: 'pub fn mint(&mut self, value: U256) -> Result<(), Erc20Error>',
        description: 'Mints tokens to the caller\'s address',
    },
    mint_to: {
        name: 'mint_to',
        signature: 'pub fn mint_to(&mut self, to: Address, value: U256) -> Result<(), Erc20Error>',
        description: 'Mints tokens to a specified address',
    },
    burn: {
        name: 'burn',
        signature: 'pub fn burn(&mut self, value: U256) -> Result<(), Erc20Error>',
        description: 'Burns tokens from the caller\'s address',
    },
};

const ERC721_FUNCTIONS = {
    mint: {
        name: 'mint',
        signature: 'pub fn mint(&mut self) -> Result<(), Vec<u8>>',
        description: 'Mints an NFT to the caller (does not call onERC721Received)',
    },
    mint_to: {
        name: 'mint_to',
        signature: 'pub fn mint_to(&mut self, to: Address) -> Result<(), Vec<u8>>',
        description: 'Mints an NFT to a specified address (does not call onERC721Received)',
    },
    safe_mint: {
        name: 'safe_mint',
        signature: 'pub fn safe_mint(&mut self, to: Address) -> Result<(), Vec<u8>>',
        description: 'Safely mints an NFT (calls onERC721Received with empty data)',
    },
    burn: {
        name: 'burn',
        signature: 'pub fn burn(&mut self, token_id: U256) -> Result<(), Vec<u8>>',
        description: 'Burns an NFT owned by the caller',
    },
};

const ERC1155_FUNCTIONS = {
    balance_of: {
        name: 'balance_of',
        signature: 'pub fn balance_of(&self, account: Address, id: U256) -> U256',
        description: 'Returns the balance of a specific token ID for an account',
    },
    balance_of_batch: {
        name: 'balance_of_batch',
        signature: 'pub fn balance_of_batch(&self, accounts: Vec<Address>, ids: Vec<U256>) -> Result<Vec<U256>, Vec<u8>>',
        description: 'Returns balances for multiple account/token ID pairs',
    },
    set_approval_for_all: {
        name: 'set_approval_for_all',
        signature: 'pub fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Vec<u8>>',
        description: 'Approves or revokes an operator for all tokens',
    },
    is_approved_for_all: {
        name: 'is_approved_for_all',
        signature: 'pub fn is_approved_for_all(&self, account: Address, operator: Address) -> bool',
        description: 'Checks if an operator is approved for all tokens of an account',
    },
    safe_transfer_from: {
        name: 'safe_transfer_from',
        signature: 'pub fn safe_transfer_from(&mut self, from: Address, to: Address, id: U256, value: U256, data: Vec<u8>) -> Result<(), Vec<u8>>',
        description: 'Safely transfers a single token type',
    },
    safe_batch_transfer_from: {
        name: 'safe_batch_transfer_from',
        signature: 'pub fn safe_batch_transfer_from(&mut self, from: Address, to: Address, ids: Vec<U256>, values: Vec<U256>, data: Vec<u8>) -> Result<(), Vec<u8>>',
        description: 'Safely transfers multiple token types in a batch',
    },
};

interface FunctionMeta {
    name: string;
    signature: string;
    description: string;
}

interface ContractConfig {
    nodeType: string;
    nodeId: string;
    nodeName: string;
    selectedFunctions: string[];
}

interface GeneratedFile {
    path: string;
    content: string;
}

function getFunctionsForType(nodeType: string): Record<string, FunctionMeta> {
    switch (nodeType) {
        case 'erc20-stylus':
            return ERC20_FUNCTIONS;
        case 'erc721-stylus':
            return ERC721_FUNCTIONS;
        case 'erc1155-stylus':
            return ERC1155_FUNCTIONS;
        default:
            return {};
    }
}

function getContractTypeName(nodeType: string): string {
    switch (nodeType) {
        case 'erc20-stylus':
            return 'ERC20 Token';
        case 'erc721-stylus':
            return 'ERC721 NFT';
        case 'erc1155-stylus':
            return 'ERC1155 Multi-Token';
        default:
            return 'Contract';
    }
}

function getSourcePath(nodeType: string): string {
    switch (nodeType) {
        case 'erc20-stylus':
            return 'packages/components/erc20-stylus/contract/erc20/src/lib.rs';
        case 'erc721-stylus':
            return 'packages/components/erc721-stylus/contract/erc721/src/lib.rs';
        case 'erc1155-stylus':
            return 'packages/components/erc1155-stylus/contract/erc1155/src/lib.rs';
        default:
            return '';
    }
}

/**
 * Generates a markdown instruction file for a single contract
 */
function generateContractMarkdown(config: ContractConfig): string {
    const functions = getFunctionsForType(config.nodeType);
    const allFunctionNames = Object.keys(functions);
    const contractType = getContractTypeName(config.nodeType);
    const sourcePath = getSourcePath(config.nodeType);

    const selectedSet = new Set(config.selectedFunctions);

    const functionsToKeep = allFunctionNames.filter(f => selectedSet.has(f));
    const functionsToRemove = allFunctionNames.filter(f => !selectedSet.has(f));

    let markdown = `# ${contractType} Contract Modification Instructions

> Generated by Cradle - Web3 Foundation Builder

## Source File
\`${sourcePath}\`

`;

    // Functions to KEEP
    if (functionsToKeep.length > 0) {
        markdown += `## Functions to KEEP ✓

These functions should remain in the contract:

`;
        for (const funcName of functionsToKeep) {
            const func = functions[funcName];
            markdown += `### \`${func.name}\`
- **Signature:** \`${func.signature}\`
- **Description:** ${func.description}

`;
        }
    }

    // Functions to REMOVE
    if (functionsToRemove.length > 0) {
        markdown += `## Functions to REMOVE ✗

These functions should be removed from the contract:

`;
        for (const funcName of functionsToRemove) {
            const func = functions[funcName];
            markdown += `### \`${func.name}\`
- **Signature:** \`${func.signature}\`
- **Description:** ${func.description}

`;
        }
    }

    // If all functions are kept
    if (functionsToRemove.length === 0) {
        markdown += `## No Modifications Required

All functions are selected - no changes needed to the contract.

`;
    }

    // Instructions for LLM
    markdown += `---

## Instructions for LLM

When modifying the contract code:

1. **Open** the source file: \`${sourcePath}\`
2. **Remove** the functions listed under "Functions to REMOVE"
3. **Keep** all functions listed under "Functions to KEEP"
4. **Clean up** any orphaned imports that are no longer needed
5. **Verify** compilation by running \`cargo check\`

### Example Prompt for LLM

\`\`\`
I have a Stylus ${contractType} contract. Please modify it according to these instructions:

${functionsToRemove.length > 0 ? `Remove these functions: ${functionsToRemove.map(f => `\`${f}\``).join(', ')}` : 'No functions need to be removed.'}

Keep these functions: ${functionsToKeep.map(f => `\`${f}\``).join(', ')}

Here is the current contract code:
[Paste lib.rs content here]
\`\`\`

`;

    return markdown;
}

/**
 * Generates markdown instruction files for all contract nodes in the blueprint
 */
export function generateContractInstructions(nodes: Array<{
    id: string;
    type: string;
    data?: {
        label?: string;
        config?: Record<string, unknown>;
    };
}>): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    const contractTypes = ['erc20-stylus', 'erc721-stylus', 'erc1155-stylus'];
    const contractNodes = nodes.filter(n => contractTypes.includes(n.type));

    if (contractNodes.length === 0) {
        return files;
    }

    for (const node of contractNodes) {
        const config = node.data?.config || {};
        const selectedFunctions = (config.selectedFunctions as string[]) || [];
        const allFunctions = Object.keys(getFunctionsForType(node.type));

        // Only generate if some functions are deselected
        const hasDeselected = selectedFunctions.length < allFunctions.length;

        if (hasDeselected || selectedFunctions.length > 0) {
            const contractConfig: ContractConfig = {
                nodeType: node.type,
                nodeId: node.id,
                nodeName: node.data?.label || getContractTypeName(node.type),
                selectedFunctions: selectedFunctions.length > 0 ? selectedFunctions : allFunctions,
            };

            const markdown = generateContractMarkdown(contractConfig);
            const fileName = `${node.type.replace('-stylus', '').toUpperCase()}_CONTRACT_INSTRUCTIONS.md`;

            files.push({
                path: `docs/${fileName}`,
                content: markdown,
            });
        }
    }

    // Generate a combined README if there are multiple contracts
    if (files.length > 1) {
        let combinedReadme = `# Contract Modification Instructions

This project contains ${files.length} smart contracts that may need modification based on your selections.

## Instruction Files

`;
        for (const file of files) {
            combinedReadme += `- [\`${file.path}\`](./${file.path})\n`;
        }

        combinedReadme += `
## How to Use

1. Open each instruction file above
2. Copy the contents along with the corresponding \`lib.rs\` source file
3. Paste both into your preferred LLM (ChatGPT, Claude, etc.)
4. The LLM will modify the contract according to the instructions
5. Replace the original \`lib.rs\` with the modified code
6. Run \`cargo check\` to verify compilation
`;

        files.push({
            path: 'docs/README.md',
            content: combinedReadme,
        });
    }

    return files;
}

/**
 * Returns all available functions for a given contract type
 */
export function getAvailableFunctions(nodeType: string): FunctionMeta[] {
    const functions = getFunctionsForType(nodeType);
    return Object.values(functions);
}

/**
 * Returns function metadata by name for a given contract type
 */
export function getFunctionByName(nodeType: string, funcName: string): FunctionMeta | null {
    const functions = getFunctionsForType(nodeType);
    return functions[funcName] || null;
}
