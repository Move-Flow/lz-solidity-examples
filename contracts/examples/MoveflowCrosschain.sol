// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "../lzApp/NonblockingLzApp.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title A LayerZero app for cross-chain asset streaming
contract MoveflowCrosschain is NonblockingLzApp {
    mapping(bytes => address) public r2lCoinMap; // remote to local coin map
    mapping(address => bytes) public l2rCoinMap; // local to remote coin map
    mapping(address => address) public coinPoolMap; // local coin to pool
    address public deployer;
    enum PacketType {
        SEND_TO_APTOS,
        RECEIVE_FROM_APTOS
    }

    event CoinRegister(address localCoin);
    event FundRecipientCx(address to, address token, uint64 amount);
    event WithdrawReqCx(address from, uint16 dstChainId, uint64 streamId);

    constructor(address _lzEndpoint) NonblockingLzApp(_lzEndpoint) {
        deployer = msg.sender;
    }

    modifier onlyDeployer() {
        require(msg.sender == deployer, "Only deployer can access the function");
        _;
    }

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress, /*_srcAddress*/
        uint64, /*_nonce*/
        bytes memory _payload
    ) internal override {
        // source chain ID / address must have been set in remote trusted
        bytes memory remoteAddress = this.getTrustedRemoteAddress(_srcChainId);
        require(keccak256(_srcAddress) == keccak256(remoteAddress));  // Todo: remove the verification, it's already verified by LZ

        fundRecipient(_payload);
    }

    function fundRecipient(bytes memory payload) internal {
        // Todo: nonce verification
        // parse the payload
        // extract 3 variables: recipient address, coin type, amount
        (address to, address token, uint64 amount) = _decodeReceivePayload(payload);

        // coin must be registered
        require(l2rCoinMap[token].length != 0, "Coin not registered!");

        // the pool must have been registgered
        // CrossChainPool notSet = CrossChainPool(address(0));
        require(coinPoolMap[token] != address(0x0), "Crosschain coin pool not registered!");

        CrossChainPool ccPool = CrossChainPool(coinPoolMap[token]);
        // balance in pool must >= amount
        require(IERC20(token).balanceOf(address(ccPool)) >= amount, "Insurfficient cx coin pool balance!");

        // transfer from pool to recipient
        ccPool.transferTokens(to, amount);

        emit FundRecipientCx(to, token, amount);
    }

    function registerCoin(bytes memory remoteCoin, address localCoin) onlyDeployer public {
        r2lCoinMap[remoteCoin] = localCoin;
        l2rCoinMap[localCoin] = remoteCoin;

        // create cross chain pool for localCoin
        CrossChainPool pool = new CrossChainPool(localCoin);
        coinPoolMap[localCoin] = address(pool);
        emit CoinRegister(localCoin);
    }

    function crossChainPoolDeposit(address coin, uint256 amount) public {
        // the coin must have been registgered
        require(l2rCoinMap[coin].length != 0, "Coin not registered!");

        // the pool must have been registgered
        require(coinPoolMap[coin] != address(0x0), "Crosschain coin pool not registered!");

        CrossChainPool ccPool = CrossChainPool(coinPoolMap[coin]);

        // sender balance must >= the amount
        require(IERC20(coin).balanceOf(address(msg.sender)) >= amount, "Insurfficient sender balance!");
        ccPool.depositTokens(msg.sender, amount);
    }

    function estimateFee(
        uint16 _dstChainId,
        bool _useZro,
        bytes calldata _adapterParams,
        uint64 _streamId
    ) public view returns (uint nativeFee, uint zroFee) {
        bytes memory payload = abi.encodePacked(uint8(PacketType.SEND_TO_APTOS), _streamId);
        return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
    }

    function withdrawCrossChainReq(uint16 _dstChainId, uint64 _streamId) public payable {
        bytes memory payload = abi.encodePacked(uint8(PacketType.SEND_TO_APTOS), _streamId);
        _lzSend(_dstChainId, payload, payable(msg.sender), address(0x0), bytes(""), msg.value);
        emit WithdrawReqCx(msg.sender, _dstChainId, _streamId);
    }

    function setOracle(uint16 dstChainId, address oracle) external onlyOwner {
        uint TYPE_ORACLE = 6;
        lzEndpoint.setConfig(lzEndpoint.getSendVersion(address(this)), dstChainId, TYPE_ORACLE, abi.encode(oracle));
    }

    function getOracle(uint16 remoteChainId) external view returns (address _oracle) {
        bytes memory bytesOracle = lzEndpoint.getConfig(lzEndpoint.getSendVersion(address(this)), remoteChainId, address(this), 6);
        assembly {
            _oracle := mload(add(bytesOracle, 32))
        }
    }

        // receive payload: packet type(1) + receiver(32) + remote token(32) + amount(8)
    function _decodeReceivePayload(bytes memory _payload) internal pure
        returns (
            address to,
            address token,
            uint64 amountSD
            // bool unwrap  // Todo: what's unwrap
        )
    {
        require(_payload.length == 73, "Moveflow crosschain: invalid payload length");
        PacketType packetType = PacketType(uint8(_payload[0]));
        require(packetType == PacketType.RECEIVE_FROM_APTOS, "Moveflow crosschain packet type");
        assembly {
            to := mload(add(_payload, 33))
            token := mload(add(_payload, 65))
            amountSD := mload(add(_payload, 73))
        }
        // unwrap = uint8(_payload[73]) == 1;
    }
}

contract CrossChainPool {
    IERC20 public token;
    address public deployer;

    event DepositCx(address from, uint256 amount);
    event TransferCx(address from, address to, uint256 amount);

    modifier onlyDeployer() {
        require(msg.sender == deployer, "Only deployer can access the function");
        _;
    }

    constructor(address _tokenAddress) {
        deployer = msg.sender;
        token = IERC20(_tokenAddress);
    }

    function depositTokens(address sender, uint256 amount) public {
        // Transfer the tokens from the sender to this contract
        require(token.transferFrom(sender, address(this), amount), "Deposit failed");
        emit DepositCx(sender, amount);
    }

    function transferTokens(address to, uint256 amount) onlyDeployer external {
        require(token.transfer(to, amount), "Transfer failed");
        emit TransferCx(msg.sender, to, amount);
    }
}
