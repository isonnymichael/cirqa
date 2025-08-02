// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./ICirqaToken.sol";

contract CirqaProtocol is Ownable {

    ICirqaToken public cirqaToken;

    // Info of each asset market
    AssetInfo[] public assetInfo;
    // Mapping from asset address to its info
    mapping(address => uint256) public assetId;

    // Info of each user.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // Total allocation points. Must be the sum of all allocation points in all asset infos.
    uint256 public totalAllocPoint = 0;
    // CIRQA tokens created per second.
    uint256 public cirqaPerSecond = 1e12; // ~0.0864 CIRQA/sec

    // Protocol fee
    uint256 public protocolFeeBps = 100; // Protocol fee in basis points. 100 bps = 1%.
    address public protocolFeeRecipient;

    struct UserInfo {
        uint256 supplied;
        uint256 borrowed;
        uint256 rewardDebt; // Reward debt. See explanation below.
        bool useAsCollateral; // Whether this asset is enabled as collateral by the user
    }

    struct AssetInfo {
        IERC20 asset; // Address of the asset token.
        uint256 allocPoint; // How many allocation points assigned to this asset.
        uint256 lastRewardTime; // Last time that CIRQA distribution occurs.
        uint256 accCirqaPerShare; // Accumulated CIRQAs per share, times 1e12.
        uint256 totalPoints; // Total points of this asset
        uint256 totalSupplied; // Total supplied amount of this asset
        uint256 totalBorrowed; // Total borrowed amount of this asset
        uint256 collateralFactor; // Percentage of the asset's value that can be borrowed against (in basis points)
        uint256 liquidationThreshold; // Threshold at which a position can be liquidated (in basis points)
        uint256 liquidationBonus; // Bonus for liquidators (in basis points)
    }

    event Supply(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Borrow(address indexed user, uint256 indexed pid, uint256 amount);
    event Repay(address indexed user, uint256 indexed pid, uint256 amount);
    event Claim(address indexed user, uint256 amount);
    event ProtocolFeePaid(address indexed asset, address indexed user, uint256 feeAmount);
    event CollateralStatusChanged(address indexed user, uint256 indexed pid, bool enabled);
    event Liquidation(address indexed liquidator, address indexed borrower, uint256 indexed assetId, uint256 amount, uint256 collateralAssetId, uint256 collateralAmount);
    event AssetConfigUpdated(uint256 indexed pid, uint256 collateralFactor, uint256 liquidationThreshold, uint256 liquidationBonus);

    /*
    |--------------------------------------------------------------------------
    | Collateral Logic
    |--------------------------------------------------------------------------
    */

    /**
     * @notice Enable or disable an asset as collateral for the user.
     * @param _pid The pool id of the asset.
     * @param _enabled True to enable as collateral, false to disable.
     */
    function setCollateralStatus(uint256 _pid, bool _enabled) external {
        userInfo[_pid][msg.sender].useAsCollateral = _enabled;
        emit CollateralStatusChanged(msg.sender, _pid, _enabled);
    }

    /**
     * @notice Returns whether the asset is enabled as collateral for a user.
     * @param _pid The pool id of the asset.
     * @param _user The address of the user.
     */
    function isCollateral(uint256 _pid, address _user) external view returns (bool) {
        return userInfo[_pid][_user].useAsCollateral;
    }

    /*
    |--------------------------------------------------------------------------
    | Constructor
    |--------------------------------------------------------------------------
    */

    /**
     * @notice Initializes the contract, setting the CIRQA token address and the initial fee recipient.
     * @param _cirqaTokenAddress The address of the CIRQA token contract.
     */
    constructor(address _cirqaTokenAddress) Ownable(msg.sender) {
        cirqaToken = ICirqaToken(_cirqaTokenAddress);
        protocolFeeRecipient = msg.sender;
    }

    /*
    |--------------------------------------------------------------------------
    | Admin Functions
    |--------------------------------------------------------------------------
    */
    
    /**
     * @notice Updates the collateral configuration for an asset.
     * @param _pid The ID of the pool to update.
     * @param _collateralFactor The percentage of the asset's value that can be borrowed against (in basis points).
     * @param _liquidationThreshold The threshold at which a position can be liquidated (in basis points).
     * @param _liquidationBonus The bonus for liquidators (in basis points).
     */
    function setAssetConfig(uint256 _pid, uint256 _collateralFactor, uint256 _liquidationThreshold, uint256 _liquidationBonus) public onlyOwner {
        require(_pid < assetInfo.length, "Invalid pool ID");
        require(_collateralFactor <= 9000, "Collateral factor too high"); // Max 90%
        require(_liquidationThreshold > _collateralFactor, "Liquidation threshold must be higher than collateral factor");
        require(_liquidationThreshold <= 9500, "Liquidation threshold too high"); // Max 95%
        require(_liquidationBonus <= 2000, "Liquidation bonus too high"); // Max 20%
        
        AssetInfo storage asset = assetInfo[_pid];
        asset.collateralFactor = _collateralFactor;
        asset.liquidationThreshold = _liquidationThreshold;
        asset.liquidationBonus = _liquidationBonus;
        
        emit AssetConfigUpdated(_pid, _collateralFactor, _liquidationThreshold, _liquidationBonus);
    }

    /**
     * @notice Sets the protocol fee percentage.
     * @dev The fee is in basis points (bps). For example, 100 bps = 1%.
     * @param _newFeeBps The new fee in basis points. Cannot exceed 1000 (10%).
     */
    function setProtocolFee(uint256 _newFeeBps) public onlyOwner {
        require(_newFeeBps <= 1000, "Fee cannot exceed 10%"); // Max fee 10%
        protocolFeeBps = _newFeeBps;
    }

    /**
     * @notice Updates the address that receives protocol fees.
     * @param _newRecipient The new address for the fee recipient.
     */
    function setProtocolFeeRecipient(address _newRecipient) public onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient address");
        protocolFeeRecipient = _newRecipient;
    }

    /**
     * @notice Updates the rate of CIRQA rewards distributed per second across all pools.
     * @param _cirqaPerSecond The new amount of CIRQA tokens per second (with 18 decimals).
     */
    function updateCirqaPerSecond(uint256 _cirqaPerSecond) public onlyOwner {
        massUpdateAssets();
        cirqaPerSecond = _cirqaPerSecond;
    }

    /**
     * @notice Adds a new asset pool to the protocol.
     * @param _allocPoint The allocation points for the new pool, determining its share of CIRQA rewards.
     * @param _asset The address of the asset token.
     * @param _withUpdate If true, updates all existing pools' rewards before adding the new one.
     */
    function add(uint256 _allocPoint, address _asset, bool _withUpdate) public onlyOwner {
        require(assetId[_asset] == 0, "Asset already added.");
        if (_withUpdate) {
            massUpdateAssets();
        }
        uint256 lastRewardTime = block.timestamp;
        totalAllocPoint = totalAllocPoint + _allocPoint;
        assetInfo.push(AssetInfo({
            asset: IERC20(_asset),
            allocPoint: _allocPoint,
            lastRewardTime: lastRewardTime,
            accCirqaPerShare: 0,
            totalPoints: 0,
            totalSupplied: 0,
            totalBorrowed: 0,
            collateralFactor: 7500, // Default 75%
            liquidationThreshold: 8500, // Default 85%
            liquidationBonus: 500 // Default 5%
        }));
        assetId[_asset] = assetInfo.length;
    }

    /**
     * @notice Updates the allocation points of an existing asset pool.
     * @param _pid The ID of the pool to update.
     * @param _allocPoint The new allocation points for the pool.
     * @param _withUpdate If true, updates all existing pools' rewards before setting the new value.
     */
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdateAssets();
        }
        totalAllocPoint = totalAllocPoint - assetInfo[_pid].allocPoint + _allocPoint;
        assetInfo[_pid].allocPoint = _allocPoint;
    }

    /*
    |--------------------------------------------------------------------------
    | Public Update Functions
    |--------------------------------------------------------------------------
    */

    /**
     * @notice Updates the reward variables for all asset pools.
     * @dev This is a public function that can be called to ensure all pools are up-to-date.
     */
    function massUpdateAssets() public {
        uint256 length = assetInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updateAsset(pid);
        }
    }

    /**
     * @notice Updates the reward variables of a single asset pool.
     * @param _pid The ID of the pool to update.
     */
    function updateAsset(uint256 _pid) public {
        AssetInfo storage asset = assetInfo[_pid];
        if (block.timestamp <= asset.lastRewardTime) {
            return;
        }
        if (asset.totalPoints == 0) {
            asset.lastRewardTime = block.timestamp;
            return;
        }
        uint256 multiplier = block.timestamp - asset.lastRewardTime;
        uint256 cirqaReward = multiplier * cirqaPerSecond * asset.allocPoint / totalAllocPoint;
        asset.accCirqaPerShare = asset.accCirqaPerShare + (cirqaReward * 1e12 / asset.totalPoints);
        asset.lastRewardTime = block.timestamp;
    }

    /*
    |--------------------------------------------------------------------------
    | View Functions
    |--------------------------------------------------------------------------
    */
    
    /**
     * @notice Calculates the available amount that can be borrowed for a specific asset.
     * @param _pid The ID of the pool.
     * @return The available amount that can be borrowed.
     */
    function getAvailableToBorrow(uint256 _pid) external view returns (uint256) {
        AssetInfo storage asset = assetInfo[_pid];
        return asset.totalSupplied - asset.totalBorrowed;
    }
    
    /**
     * @notice Calculates the total borrowing capacity of a user across all assets.
     * @param _user The address of the user.
     * @return totalCapacity The total borrowing capacity in USD.
     */
    function getUserBorrowingCapacity(address _user) public view returns (uint256 totalCapacity) {
        uint256 len = assetInfo.length;
        for (uint256 pid = 0; pid < len; ++pid) {
            UserInfo storage user = userInfo[pid][_user];
            if (user.useAsCollateral && user.supplied > 0) {
                // In a real implementation, this would use price oracles to convert to USD
                // TODO: For simplicity, we're assuming 1:1 value for all assets
                totalCapacity += (user.supplied * assetInfo[pid].collateralFactor) / 10000;
            }
        }
        return totalCapacity;
    }
    
    /**
     * @notice Calculates the total borrowed value of a user across all assets.
     * @param _user The address of the user.
     * @return totalBorrowed The total borrowed value in USD.
     */
    function getUserTotalBorrowed(address _user) public view returns (uint256 totalBorrowed) {
        uint256 len = assetInfo.length;
        for (uint256 pid = 0; pid < len; ++pid) {
            // In a real implementation, this would use price oracles to convert to USD
            // TODO: For simplicity, we're assuming 1:1 value for all assets
            totalBorrowed += userInfo[pid][_user].borrowed;
        }
        return totalBorrowed;
    }
    
    /**
     * @notice Checks if a user has enough collateral to borrow a specific amount of an asset.
     * @param _user The address of the user.
     * @param _asset The address of the asset to borrow.
     * @param _amount The amount of the asset to borrow.
     * @return True if the user has enough collateral, false otherwise.
     */
    function hasEnoughCollateral(address _user, address _asset, uint256 _amount) public view returns (bool) {
        uint256 borrowCapacity = getUserBorrowingCapacity(_user);
        uint256 currentBorrowed = getUserTotalBorrowed(_user);
        
        // In a real implementation, this would use price oracles to convert to USD
        // TODO: For simplicity, we're assuming 1:1 value for all assets
        return (currentBorrowed + _amount) <= borrowCapacity;
    }
    
    /**
     * @notice Checks if a user's position is liquidatable.
     * @param _user The address of the user.
     * @return True if the user's position is liquidatable, false otherwise.
     */
    function isLiquidatable(address _user) public view returns (bool) {
        uint256 len = assetInfo.length;
        uint256 totalCollateralValue = 0;
        uint256 liquidationLimit = 0;
        
        for (uint256 pid = 0; pid < len; ++pid) {
            UserInfo storage user = userInfo[pid][_user];
            if (user.useAsCollateral && user.supplied > 0) {
                // In a real implementation, this would use price oracles to convert to USD
                // TODO: For simplicity, we're assuming 1:1 value for all assets
                totalCollateralValue += user.supplied;
                liquidationLimit += (user.supplied * assetInfo[pid].liquidationThreshold) / 10000;
            }
        }
        
        if (totalCollateralValue == 0) return false;
        
        uint256 totalBorrowed = getUserTotalBorrowed(_user);
        return totalBorrowed > liquidationLimit;
    }

    /**
     * @notice Returns the total number of asset pools.
     * @return The number of asset pools.
     */
    function getAssetsLength() external view returns (uint256) {
        return assetInfo.length;
    }

    /**
     * @notice Gets aggregated asset information across all pools.
     * @return totalValueLocked The total value supplied across all assets.
     * @return totalBorrows The total value borrowed across all assets.
     */
    function getGlobalAssetInfo() external view returns (uint256 totalValueLocked, uint256 totalBorrows) {
        uint256 len = assetInfo.length;
        for (uint256 pid = 0; pid < len; ++pid) {
            totalValueLocked += assetInfo[pid].totalSupplied;
            totalBorrows += assetInfo[pid].totalBorrowed;
        }
    }

    function getGlobalUserInfo(address _user) external view returns (uint256 totalSupplied, uint256 totalBorrowed, uint256 totalPendingCirqa) {
        uint256 len = assetInfo.length;
        for (uint256 pid = 0; pid < len; ++pid) {
            UserInfo storage user = userInfo[pid][_user];
            totalSupplied += user.supplied;
            totalBorrowed += user.borrowed;

            AssetInfo storage asset = assetInfo[pid];
            uint256 accCirqaPerShare = asset.accCirqaPerShare;
            if (block.timestamp > asset.lastRewardTime && asset.totalPoints != 0) {
                uint256 multiplier = block.timestamp - asset.lastRewardTime;
                uint256 cirqaReward = multiplier * cirqaPerSecond * asset.allocPoint / totalAllocPoint;
                accCirqaPerShare += (cirqaReward * 1e12 / asset.totalPoints);
            }
            uint256 points = user.supplied + (user.borrowed / 2);
            totalPendingCirqa += (points * accCirqaPerShare / 1e12 - user.rewardDebt);
        }
    }

    /**
     * @notice Calculates the amount of pending CIRQA rewards for a user in a specific pool.
     * @param _pid The ID of the pool.
     * @param _user The address of the user.
     * @return The amount of pending CIRQA tokens.
     */
    function pendingCirqa(uint256 _pid, address _user) external view returns (uint256) {
        AssetInfo storage asset = assetInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accCirqaPerShare = asset.accCirqaPerShare;
        if (block.timestamp > asset.lastRewardTime && asset.totalPoints != 0) {
            uint256 multiplier = block.timestamp - asset.lastRewardTime;
            uint256 cirqaReward = multiplier * cirqaPerSecond * asset.allocPoint / totalAllocPoint;
            accCirqaPerShare = accCirqaPerShare + (cirqaReward * 1e12 / asset.totalPoints);
        }
        uint256 points = user.supplied + (user.borrowed / 2);
        return points * accCirqaPerShare / 1e12 - user.rewardDebt;
    }

    /*
    |--------------------------------------------------------------------------
    | Core Logic (Internal Functions)
    |--------------------------------------------------------------------------
    */

    /**
     * @notice Updates a user's reward state and transfers any pending CIRQA.
     * @dev This function is called before any action that changes a user's points.
     * @param _pid The ID of the pool.
     * @param _user The address of the user.
     */
    function _updateUser(uint256 _pid, address _user) internal {
        updateAsset(_pid);
        UserInfo storage user = userInfo[_pid][_user];
        uint256 points = user.supplied + (user.borrowed / 2);
        uint256 pending = points * assetInfo[_pid].accCirqaPerShare / 1e12 - user.rewardDebt;
        if (pending > 0) {
            cirqaToken.mint(_user, pending);
            emit Claim(_user, pending);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | User-Facing Functions
    |--------------------------------------------------------------------------
    */

    /**
     * @notice Supplies an asset to a pool to earn rewards.
     * @param _asset The address of the asset to supply.
     * @param _amount The amount of the asset to supply.
     */
    function supply(address _asset, uint256 _amount) external {
        uint256 pid = assetId[_asset] - 1;
        _updateUser(pid, msg.sender);

        UserInfo storage user = userInfo[pid][msg.sender];
        AssetInfo storage asset = assetInfo[pid];

        uint256 oldPoints = user.supplied + (user.borrowed / 2);
        user.supplied += _amount;
        uint256 newPoints = user.supplied + (user.borrowed / 2);

        asset.totalPoints = asset.totalPoints - oldPoints + newPoints;
        asset.totalSupplied += _amount;
        user.rewardDebt = newPoints * asset.accCirqaPerShare / 1e12;

        assetInfo[pid].asset.transferFrom(msg.sender, address(this), _amount);
        emit Supply(msg.sender, pid, _amount);
    }

    /**
     * @notice Withdraws an asset from a pool.
     * @param _asset The address of the asset to withdraw.
     * @param _amount The amount of the asset to withdraw.
     */
    function withdraw(address _asset, uint256 _amount) external {
        uint256 pid = assetId[_asset] - 1;
        UserInfo storage user = userInfo[pid][msg.sender];
        require(user.supplied >= _amount, "withdraw: not enough supplied");

        _updateUser(pid, msg.sender);

        AssetInfo storage asset = assetInfo[pid];

        uint256 oldPoints = user.supplied + (user.borrowed / 2);
        user.supplied -= _amount;
        uint256 newPoints = user.supplied + (user.borrowed / 2);

        asset.totalPoints = asset.totalPoints - oldPoints + newPoints;
        asset.totalSupplied -= _amount;
        user.rewardDebt = newPoints * asset.accCirqaPerShare / 1e12;

        assetInfo[pid].asset.transfer(msg.sender, _amount);
        emit Withdraw(msg.sender, pid, _amount);
    }

    /**
     * @notice Borrows an asset from a pool.
     * @dev A protocol fee is taken from the borrowed amount.
     * @param _asset The address of the asset to borrow.
     * @param _amount The amount of the asset to borrow.
     */
    function borrow(address _asset, uint256 _amount) external {
        uint256 pid = assetId[_asset] - 1;
        _updateUser(pid, msg.sender);

        AssetInfo storage asset = assetInfo[pid];
        
        // Check if there's enough liquidity in the pool
        require(asset.totalSupplied - asset.totalBorrowed >= _amount, "Insufficient liquidity in pool");
        
        // Check if user has enough collateral
        require(hasEnoughCollateral(msg.sender, _asset, _amount), "Insufficient collateral");

        uint256 feeAmount = _amount * protocolFeeBps / 10000;
        uint256 amountToUser = _amount - feeAmount;

        if (feeAmount > 0) {
            asset.asset.transfer(protocolFeeRecipient, feeAmount);
            emit ProtocolFeePaid(_asset, msg.sender, feeAmount);
        }

        UserInfo storage user = userInfo[pid][msg.sender];

        uint256 oldPoints = user.supplied + (user.borrowed / 2);
        user.borrowed += _amount;
        uint256 newPoints = user.supplied + (user.borrowed / 2);

        asset.totalPoints = asset.totalPoints - oldPoints + newPoints;
        asset.totalBorrowed += _amount;
        user.rewardDebt = newPoints * asset.accCirqaPerShare / 1e12;

        if (amountToUser > 0) {
            asset.asset.transfer(msg.sender, amountToUser);
        }
        emit Borrow(msg.sender, pid, _amount);
    }

    /**
     * @notice Repays a borrowed asset.
     * @param _asset The address of the asset to repay.
     * @param _amount The amount of the asset to repay.
     */
    function repay(address _asset, uint256 _amount) external {
        uint256 pid = assetId[_asset] - 1;
        UserInfo storage user = userInfo[pid][msg.sender];
        require(user.borrowed >= _amount, "repay: not enough borrowed");

        _updateUser(pid, msg.sender);

        AssetInfo storage asset = assetInfo[pid];

        uint256 oldPoints = user.supplied + (user.borrowed / 2);
        user.borrowed -= _amount;
        uint256 newPoints = user.supplied + (user.borrowed / 2);

        asset.totalPoints = asset.totalPoints - oldPoints + newPoints;
        asset.totalBorrowed -= _amount;
        user.rewardDebt = newPoints * asset.accCirqaPerShare / 1e12;

        asset.asset.transferFrom(msg.sender, address(this), _amount);
        emit Repay(msg.sender, pid, _amount);
    }
    
    /**
     * @notice Liquidates an undercollateralized position.
     * @param _borrower The address of the borrower to liquidate.
     * @param _assetBorrowed The address of the borrowed asset to repay.
     * @param _assetCollateral The address of the collateral asset to receive.
     * @param _amount The amount of the borrowed asset to repay.
     */
    function liquidate(address _borrower, address _assetBorrowed, address _assetCollateral, uint256 _amount) external {
        require(_borrower != msg.sender, "Cannot liquidate yourself");
        require(isLiquidatable(_borrower), "Borrower is not liquidatable");
        
        uint256 borrowedPid = assetId[_assetBorrowed] - 1;
        uint256 collateralPid = assetId[_assetCollateral] - 1;
        
        UserInfo storage borrowerBorrowInfo = userInfo[borrowedPid][_borrower];
        UserInfo storage borrowerCollateralInfo = userInfo[collateralPid][_borrower];
        
        require(borrowerBorrowInfo.borrowed > 0, "Borrower has no debt in this asset");
        require(borrowerCollateralInfo.supplied > 0 && borrowerCollateralInfo.useAsCollateral, "No collateral available");
        
        // Limit the liquidation amount to the borrowed amount
        uint256 actualRepayAmount = _amount;
        if (actualRepayAmount > borrowerBorrowInfo.borrowed) {
            actualRepayAmount = borrowerBorrowInfo.borrowed;
        }
        
        // Calculate the collateral to seize
        // In a real implementation, this would use price oracles to convert between assets
        // TODO: For simplicity, we're assuming 1:1 value for all assets with a liquidation bonus
        AssetInfo storage collateralAsset = assetInfo[collateralPid];
        uint256 bonusMultiplier = 10000 + collateralAsset.liquidationBonus;
        uint256 collateralToSeize = (actualRepayAmount * bonusMultiplier) / 10000;
        
        // Ensure we don't seize more than available
        if (collateralToSeize > borrowerCollateralInfo.supplied) {
            collateralToSeize = borrowerCollateralInfo.supplied;
        }
        
        // Update borrower's borrowed amount
        _updateUser(borrowedPid, _borrower);
        uint256 oldBorrowPoints = borrowerBorrowInfo.supplied + (borrowerBorrowInfo.borrowed / 2);
        borrowerBorrowInfo.borrowed -= actualRepayAmount;
        uint256 newBorrowPoints = borrowerBorrowInfo.supplied + (borrowerBorrowInfo.borrowed / 2);
        
        AssetInfo storage borrowedAsset = assetInfo[borrowedPid];
        borrowedAsset.totalPoints = borrowedAsset.totalPoints - oldBorrowPoints + newBorrowPoints;
        borrowedAsset.totalBorrowed -= actualRepayAmount;
        borrowerBorrowInfo.rewardDebt = newBorrowPoints * borrowedAsset.accCirqaPerShare / 1e12;
        
        // Update borrower's collateral amount
        _updateUser(collateralPid, _borrower);
        uint256 oldCollateralPoints = borrowerCollateralInfo.supplied + (borrowerCollateralInfo.borrowed / 2);
        borrowerCollateralInfo.supplied -= collateralToSeize;
        uint256 newCollateralPoints = borrowerCollateralInfo.supplied + (borrowerCollateralInfo.borrowed / 2);
        
        collateralAsset.totalPoints = collateralAsset.totalPoints - oldCollateralPoints + newCollateralPoints;
        collateralAsset.totalSupplied -= collateralToSeize;
        borrowerCollateralInfo.rewardDebt = newCollateralPoints * collateralAsset.accCirqaPerShare / 1e12;
        
        // Transfer assets
        borrowedAsset.asset.transferFrom(msg.sender, address(this), actualRepayAmount);
        collateralAsset.asset.transfer(msg.sender, collateralToSeize);
        
        emit Liquidation(msg.sender, _borrower, borrowedPid, actualRepayAmount, collateralPid, collateralToSeize);
    }
}