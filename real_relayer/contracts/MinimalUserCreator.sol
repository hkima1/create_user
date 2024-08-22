// SPDX-License-Identifier: MIT

pragma solidity 0.8.21;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";

/**
 * @title MinimalUserCreator
 * @dev This contract handles the creation of user accounts via a proxy contract.
 */
contract MinimalUserCreator is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC2771ContextUpgradeable
{
    address public userAccountImplementation; // Address of the implementation contract
    struct User {
        string username;
        uint256 gender;
    }
    mapping(address => User) private users;

    event UserRegistered(
        address indexed userAddress,
        string username,
        uint256 gender
    );
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        address trustedForwarder_
    ) ERC2771ContextUpgradeable(trustedForwarder_) {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract with the implementation contract address and owner.
     * @param _implementation Address of the implementation contract
     * @param _owner Address of the owner of this contract
     */
    function initialize(
        address _implementation,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        userAccountImplementation = _implementation;
    }

    /**
     * @dev Function to create a new user account
     * @param _userName Name of the user
     * @param gender Gender of the user (e.g., 1 for Male, 2 for Female)
     * @return address The address of the newly created user account
     */
    function createUserAccount(
        string memory _userName,
        uint256 gender
    ) external returns (uint256) {
        //require(_msgSender() != address(0), "Main wallet address cannot be 0");
        require(bytes(_userName).length > 0, "Username cannot be empty");
        require(gender == 1 || gender == 2, "Invalid gender"); // Assuming gender can only be 1 (Male) or 2 (Female)

        users[_msgSender()] = User(_userName, gender);
        emit UserRegistered(_msgSender(), _userName, gender);
        return 1;
    }

    function getUser(
        address userAddress
    ) public view returns (string memory userName, uint256 gender) {
        User memory user = users[userAddress];
        return (user.username, user.gender);
    }

    // Override _msgSender and _msgData to use ERC2771Context
    function _msgSender()
        internal
        view
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (address)
    {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (bytes calldata)
    {
        return ERC2771ContextUpgradeable._msgData();
    }

    /**
     * @dev Function required for UUPS upgradeability.
     * Only callable by the proxy admin.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // Override the conflicting function
    function _contextSuffixLength()
        internal
        view
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (uint256)
    {
        return ERC2771ContextUpgradeable._contextSuffixLength();
    }
}

contract DeployUUPSProxy {
    address public implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function createProxy() external returns (address) {
        // Encode the initialization function call with the correct arguments
        bytes memory data = abi.encodeWithSelector(
            MinimalUserCreator(implementation).initialize.selector,
            msg.sender // Initial owner/admin of the contract
        );

        // Deploy the proxy with the implementation address and initialization data
        ERC1967Proxy proxy = new ERC1967Proxy(implementation, data);
        return address(proxy);
    }
}
