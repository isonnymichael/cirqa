// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ICirqaToken.sol";

contract CirqaProtocol is Ownable {
    using SafeMath for uint256;

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

    struct UserInfo {
        uint256 points; // How many points the user has.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    struct AssetInfo {
        IERC20 asset; // Address of the asset token.
        uint256 allocPoint; // How many allocation points assigned to this asset.
        uint256 lastRewardTime; // Last time that CIRQA distribution occurs.
        uint256 accCirqaPerShare; // Accumulated CIRQAs per share, times 1e12.
        uint256 totalPoints; // Total points of this asset
    }

    event Supply(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Borrow(address indexed user, uint256 indexed pid, uint256 amount);
    event Repay(address indexed user, uint256 indexed pid, uint256 amount);
    event Claim(address indexed user, uint256 amount);

    constructor(address _cirqaTokenAddress) Ownable(msg.sender) {
        cirqaToken = ICirqaToken(_cirqaTokenAddress);
    }

    function updateCirqaPerSecond(uint256 _cirqaPerSecond) public onlyOwner {
        massUpdateAssets();
        cirqaPerSecond = _cirqaPerSecond;
    }

    function massUpdateAssets() public {
        uint256 length = assetInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updateAsset(pid);
        }
    }

    function updateAsset(uint256 _pid) public {
        AssetInfo storage asset = assetInfo[_pid];
        if (block.timestamp <= asset.lastRewardTime) {
            return;
        }
        if (asset.totalPoints == 0) {
            asset.lastRewardTime = block.timestamp;
            return;
        }
        uint256 multiplier = block.timestamp.sub(asset.lastRewardTime);
        uint256 cirqaReward = multiplier.mul(cirqaPerSecond).mul(asset.allocPoint).div(totalAllocPoint);
        asset.accCirqaPerShare = asset.accCirqaPerShare.add(cirqaReward.mul(1e12).div(asset.totalPoints));
        asset.lastRewardTime = block.timestamp;
    }

    function add(uint256 _allocPoint, address _asset, bool _withUpdate) public onlyOwner {
        require(assetId[_asset] == 0, "Asset already added.");
        if (_withUpdate) {
            massUpdateAssets();
        }
        uint256 lastRewardTime = block.timestamp > assetInfo.length > 0 ? block.timestamp : assetInfo[0].lastRewardTime;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        assetInfo.push(AssetInfo({
            asset: IERC20(_asset),
            allocPoint: _allocPoint,
            lastRewardTime: lastRewardTime,
            accCirqaPerShare: 0,
            totalPoints: 0
        }));
        assetId[_asset] = assetInfo.length;
    }

    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdateAssets();
        }
        totalAllocPoint = totalAllocPoint.sub(assetInfo[_pid].allocPoint).add(_allocPoint);
        assetInfo[_pid].allocPoint = _allocPoint;
    }

    function pendingCirqa(uint256 _pid, address _user) external view returns (uint256) {
        AssetInfo storage asset = assetInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accCirqaPerShare = asset.accCirqaPerShare;
        if (block.timestamp > asset.lastRewardTime && asset.totalPoints != 0) {
            uint256 multiplier = block.timestamp.sub(asset.lastRewardTime);
            uint256 cirqaReward = multiplier.mul(cirqaPerSecond).mul(asset.allocPoint).div(totalAllocPoint);
            accCirqaPerShare = accCirqaPerShare.add(cirqaReward.mul(1e12).div(asset.totalPoints));
        }
        return user.points.mul(accCirqaPerShare).div(1e12).sub(user.rewardDebt);
    }

    function _updateUser(uint256 _pid, address _user) internal {
        updateAsset(_pid);
        UserInfo storage user = userInfo[_pid][_user];
        uint256 pending = user.points.mul(assetInfo[_pid].accCirqaPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0) {
            cirqaToken.transfer(_user, pending);
            emit Claim(_user, pending);
        }
    }

    function _updatePoints(uint256 _pid, address _user, uint256 _newPoints) internal {
        _updateUser(_pid, _user);
        AssetInfo storage asset = assetInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        asset.totalPoints = asset.totalPoints.sub(user.points).add(_newPoints);
        user.points = _newPoints;
        user.rewardDebt = _newPoints.mul(asset.accCirqaPerShare).div(1e12);
    }

    function supply(address _asset, uint256 _amount) external {
        uint256 pid = assetId[_asset] - 1;
        UserInfo storage user = userInfo[pid][msg.sender];
        uint256 newPoints = user.points.add(_amount);
        _updatePoints(pid, msg.sender, newPoints);
        assetInfo[pid].asset.transferFrom(msg.sender, address(this), _amount);
        emit Supply(msg.sender, pid, _amount);
    }

    function withdraw(address _asset, uint256 _amount) external {
        uint256 pid = assetId[_asset] - 1;
        UserInfo storage user = userInfo[pid][msg.sender];
        require(user.points >= _amount, "withdraw: not good");
        uint256 newPoints = user.points.sub(_amount);
        _updatePoints(pid, msg.sender, newPoints);
        assetInfo[pid].asset.transfer(msg.sender, _amount);
        emit Withdraw(msg.sender, pid, _amount);
    }

    function borrow(address _asset, uint256 _amount) external {
        uint256 pid = assetId[_asset] - 1;
        // Here should be a logic to check if user has enough collateral
        // For simplicity, we skip it for now
        UserInfo storage user = userInfo[pid][msg.sender];
        uint256 newPoints = user.points.add(_amount.div(2)); // Borrowers get half points
        _updatePoints(pid, msg.sender, newPoints);
        assetInfo[pid].asset.transfer(msg.sender, _amount);
        emit Borrow(msg.sender, pid, _amount);
    }

    function repay(address _asset, uint256 _amount) external {
        uint256 pid = assetId[_asset] - 1;
        UserInfo storage user = userInfo[pid][msg.sender];
        // This is a simplified logic. In reality, you need to track borrowed amount separately.
        uint256 borrowedAmount = user.points.mul(2); // Re-calculate borrowed amount from points
        require(borrowedAmount >= _amount, "repay: not good");
        uint256 newPoints = user.points.sub(_amount.div(2));
        _updatePoints(pid, msg.sender, newPoints);
        assetInfo[pid].asset.transferFrom(msg.sender, address(this), _amount);
        emit Repay(msg.sender, pid, _amount);
    }

    function claimReward(uint256 _pid) public {
        _updateUser(_pid, msg.sender);
    }
}