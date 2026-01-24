// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ERC8004AgentRegistry
 * @notice Registry for ERC-8004 AI agents with staking and reputation
 * @dev Minimal implementation with Ownable access control
 */
contract ERC8004AgentRegistry {
    // Structs
    struct Agent {
        address owner;
        string name;
        string version;
        string[] capabilities;
        uint256 stake;
        uint256 reputation;
        bool isActive;
        uint256 registeredAt;
    }

    // State variables
    mapping(bytes32 => Agent) public agents;
    mapping(address => bytes32) public ownerToAgentId;
    uint256 public totalAgents;
    address public owner;

    // Events
    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed owner,
        string name,
        string version
    );
    event AgentUpdated(
        bytes32 indexed agentId,
        string[] capabilities
    );
    event AgentStaked(
        bytes32 indexed agentId,
        uint256 amount
    );
    event AgentWithdrawn(
        bytes32 indexed agentId,
        uint256 amount
    );
    event AgentDeactivated(
        bytes32 indexed agentId
    );
    event AgentReactivated(
        bytes32 indexed agentId
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyAgentOwner(bytes32 agentId) {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        _;
    }

    modifier onlyActiveAgent(bytes32 agentId) {
        require(agents[agentId].isActive, "Agent not active");
        _;
    }

    /**
     * @notice Initialize contract with deployer as owner
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Register a new AI agent
     * @param name Agent name
     * @param version Agent version
     * @param capabilities Array of agent capabilities
     * @return agentId Unique agent identifier
     */
    function registerAgent(
        string calldata name,
        string calldata version,
        string[] calldata capabilities
    ) external payable returns (bytes32 agentId) {
        // Validation
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(version).length > 0, "Version cannot be empty");
        require(capabilities.length > 0, "At least one capability required");
        require(msg.sender != address(0), "Invalid owner address");
        require(
            ownerToAgentId[msg.sender] == bytes32(0),
            "Already registered"
        );

        // Generate agent ID
        agentId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, totalAgents)
        );

        // Create agent struct
        Agent storage agent = agents[agentId];
        agent.owner = msg.sender;
        agent.name = name;
        agent.version = version;
        agent.stake = msg.value;
        agent.reputation = 0;
        agent.isActive = true;
        agent.registeredAt = block.timestamp;

        // Manually copy capabilities array
        for (uint256 i = 0; i < capabilities.length; i++) {
            agent.capabilities.push(capabilities[i]);
        }

        // Update mappings
        ownerToAgentId[msg.sender] = agentId;
        totalAgents++;

        emit AgentRegistered(agentId, msg.sender, name, version);
    }

    /**
     * @notice Update agent capabilities
     * @param agentId Agent identifier
     * @param capabilities New capabilities array
     */
    function updateCapabilities(
        bytes32 agentId,
        string[] calldata capabilities
    ) external onlyAgentOwner(agentId) onlyActiveAgent(agentId) {
        require(capabilities.length > 0, "At least one capability required");

        // Clear existing capabilities
        delete agents[agentId].capabilities;

        // Manually copy new capabilities
        for (uint256 i = 0; i < capabilities.length; i++) {
            agents[agentId].capabilities.push(capabilities[i]);
        }

        emit AgentUpdated(agentId, capabilities);
    }

    /**
     * @notice Update agent metadata (name and version)
     * @param agentId Agent identifier
     * @param name New agent name
     * @param version New agent version
     */
    function updateAgentMetadata(
        bytes32 agentId,
        string calldata name,
        string calldata version
    ) external onlyAgentOwner(agentId) onlyActiveAgent(agentId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(version).length > 0, "Version cannot be empty");

        agents[agentId].name = name;
        agents[agentId].version = version;
    }

    /**
     * @notice Add stake to agent
     * @param agentId Agent identifier
     */
    function stake(bytes32 agentId) external payable onlyActiveAgent(agentId) {
        require(msg.value > 0, "Must stake something");

        agents[agentId].stake += msg.value;
        emit AgentStaked(agentId, msg.value);
    }

    /**
     * @notice Withdraw stake from agent
     * @param agentId Agent identifier
     * @param amount Amount to withdraw
     */
    function withdraw(
        bytes32 agentId,
        uint256 amount
    ) external onlyAgentOwner(agentId) onlyActiveAgent(agentId) {
        Agent storage agent = agents[agentId];
        require(amount > 0, "Amount must be greater than 0");
        require(agent.stake >= amount, "Insufficient stake");

        // Check-effects-interactions pattern
        agent.stake -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit AgentWithdrawn(agentId, amount);
    }

    /**
     * @notice Deactivate agent
     * @param agentId Agent identifier
     */
    function deactivateAgent(bytes32 agentId) external onlyAgentOwner(agentId) {
        require(agents[agentId].isActive, "Already deactivated");

        agents[agentId].isActive = false;
        emit AgentDeactivated(agentId);
    }

    /**
     * @notice Reactivate agent
     * @param agentId Agent identifier
     */
    function reactivateAgent(bytes32 agentId) external onlyAgentOwner(agentId) {
        require(!agents[agentId].isActive, "Already active");

        agents[agentId].isActive = true;
        emit AgentReactivated(agentId);
    }

    /**
     * @notice Transfer contract ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        require(newOwner != owner, "Same owner");

        address oldOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Get agent details
     * @param agentId Agent identifier
     * @return agent Agent details
     */
    function getAgent(bytes32 agentId) external view returns (Agent memory agent) {
        agent = agents[agentId];
        require(agent.owner != address(0), "Agent not found");
    }

    /**
     * @notice Get agent ID by owner address
     * @param ownerAddress Owner address
     * @return agentId Agent identifier
     */
    function getAgentByOwner(address ownerAddress) external view returns (bytes32 agentId) {
        agentId = ownerToAgentId[ownerAddress];
        require(agentId != bytes32(0), "Agent not found");
    }

    /**
     * @notice Check if an address has a registered agent
     * @param ownerAddress Owner address
     * @return registered Whether agent is registered
     */
    function isAgentRegistered(address ownerAddress) external view returns (bool registered) {
        registered = ownerToAgentId[ownerAddress] != bytes32(0);
    }

    /**
     * @notice Get all capabilities of an agent
     * @param agentId Agent identifier
     * @return capabilities Array of capabilities
     */
    function getAgentCapabilities(bytes32 agentId) external view returns (string[] memory capabilities) {
        capabilities = agents[agentId].capabilities;
    }
}
