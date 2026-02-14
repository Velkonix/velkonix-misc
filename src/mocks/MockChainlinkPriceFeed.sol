// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

contract MockChainlinkPriceFeed {
    error NoDataPresent();
    error InvalidRound();
    error InvalidTimestamps();

    event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt);
    event NewRound(uint256 indexed roundId, address indexed startedBy, uint256 startedAt);

    struct RoundData {
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
    }

    uint256 private constant VERSION = 1;

    uint8 private immutable i_decimals;
    string private s_description;
    uint80 private s_latestRoundId;
    mapping(uint80 => RoundData) private s_roundData;

    constructor(uint8 decimals_, string memory description_, int256 initialAnswer) {
        i_decimals = decimals_;
        s_description = description_;
        _pushRound(initialAnswer, block.timestamp, block.timestamp, 0);
    }

    // Chainlink V3 interface methods
    function decimals() external view returns (uint8) {
        return i_decimals;
    }

    function description() external view returns (string memory) {
        return s_description;
    }

    function version() external pure returns (uint256) {
        return VERSION;
    }

    function getRoundData(
        uint80 roundId
    ) external view returns (uint80, int256, uint256, uint256, uint80) {
        RoundData memory round = s_roundData[roundId];
        if (round.updatedAt == 0) {
            revert NoDataPresent();
        }

        return (roundId, round.answer, round.startedAt, round.updatedAt, round.answeredInRound);
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        uint80 roundId = s_latestRoundId;
        RoundData memory round = s_roundData[roundId];
        if (round.updatedAt == 0) {
            revert NoDataPresent();
        }

        return (roundId, round.answer, round.startedAt, round.updatedAt, round.answeredInRound);
    }

    // Chainlink V2 interface methods
    function latestAnswer() external view returns (int256) {
        return s_roundData[s_latestRoundId].answer;
    }

    function latestTimestamp() external view returns (uint256) {
        return s_roundData[s_latestRoundId].updatedAt;
    }

    function latestRound() external view returns (uint256) {
        return s_latestRoundId;
    }

    function getAnswer(uint256 roundId) external view returns (int256) {
        return s_roundData[uint80(roundId)].answer;
    }

    function getTimestamp(uint256 roundId) external view returns (uint256) {
        return s_roundData[uint80(roundId)].updatedAt;
    }

    // Mock update methods
    function updateAnswer(int256 answer) external {
        _pushRound(answer, block.timestamp, block.timestamp, 0);
    }

    function updateRoundData(int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) external {
        if (updatedAt < startedAt || updatedAt == 0) {
            revert InvalidTimestamps();
        }
        _pushRound(answer, startedAt, updatedAt, answeredInRound);
    }

    function _pushRound(int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) internal {
        uint80 roundId = s_latestRoundId + 1;
        uint80 normalizedAnsweredInRound = answeredInRound == 0 ? roundId : answeredInRound;
        if (normalizedAnsweredInRound < roundId) {
            revert InvalidRound();
        }

        s_latestRoundId = roundId;
        s_roundData[roundId] = RoundData({
            answer: answer,
            startedAt: startedAt,
            updatedAt: updatedAt,
            answeredInRound: normalizedAnsweredInRound
        });

        emit NewRound(roundId, msg.sender, startedAt);
        emit AnswerUpdated(answer, roundId, updatedAt);
    }
}
