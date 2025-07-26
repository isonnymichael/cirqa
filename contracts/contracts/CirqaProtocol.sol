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
    uint256 public cirqaPerSecond = 158e15; // ~0.158 CIRQA/sec

    // Protocol fee
    uint256 public protocolFeeBps = 0; // Protocol fee in basis points. 100 bps = 1%.
    address public protocolFeeRecipient;

    struct UserInfo {
        uint256 supplied;
        uint256 borrowed;
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    struct AssetInfo {
        IERC20 asset; // Address of the asset token.
        uint256 allocPoint; // How many allocation points assigned to this asset.
        uint256 lastRewardTime; // Last time that CIRQA distribution occurs.
        uint256 accCirqaPerShare; // Accumulated CIRQAs per share, times 1e12.
        uint256 totalPoints; // Total points of this asset
        uint256 totalSupplied; // Total supplied amount of this asset
        uint256 totalBorrowed; // Total borrowed amount of this asset
    }

    event Supply(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Borrow(address indexed user, uint256 indexed pid, uint256 amount);
    event Repay(address indexed user, uint256 indexed pid, uint256 amount);
    event Claim(address indexed user, uint256 amount);
    event ProtocolFeePaid(address indexed asset, address indexed user, uint256 feeAmount);

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
            totalBorrowed: 0
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

        uint256 feeAmount = _amount * protocolFeeBps / 10000;
        uint256 amountToUser = _amount - feeAmount;

        if (feeAmount > 0) {
            assetInfo[pid].asset.transfer(protocolFeeRecipient, feeAmount);
            emit ProtocolFeePaid(_asset, msg.sender, feeAmount);
        }

        UserInfo storage user = userInfo[pid][msg.sender];
        AssetInfo storage asset = assetInfo[pid];

        uint256 oldPoints = user.supplied + (user.borrowed / 2);
        user.borrowed += _amount;
        uint256 newPoints = user.supplied + (user.borrowed / 2);

        asset.totalPoints = asset.totalPoints - oldPoints + newPoints;
        asset.totalBorrowed += _amount;
        user.rewardDebt = newPoints * asset.accCirqaPerShare / 1e12;

        if (amountToUser > 0) {
            assetInfo[pid].asset.transfer(msg.sender, amountToUser);
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

        assetInfo[pid].asset.transferFrom(msg.sender, address(this), _amount);
        emit Repay(msg.sender, pid, _amount);
    }

    /**
     * @notice Claims pending CIRQA rewards for the caller from a specific pool.
     * @param _pid The ID of the pool to claim from.
     */
    function claimReward(uint256 _pid) public {
        _updateUser(_pid, msg.sender);
    }
}