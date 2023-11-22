// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "../lzApp/NonblockingLzApp.sol";

/// @title A LayerZero app for cross-chain asset streaming
contract MoveflowCrosschain is NonblockingLzApp {
    enum PacketType {
        SEND_TO_APTOS,
        RECEIVE_FROM_APTOS
    }

    constructor(address _lzEndpoint) NonblockingLzApp(_lzEndpoint) {}

    function _nonblockingLzReceive(
        uint16,
        bytes memory,
        uint64,
        bytes memory
    ) internal override {
        // Todo: call withdrawCrossChainRes
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
}
