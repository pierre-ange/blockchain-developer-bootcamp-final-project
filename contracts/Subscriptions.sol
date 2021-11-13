// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title A subscription contract allowing publishers to create subscription plans and users to subscribe to these plans, renew, pause or cancel their subscriptions.
 * @author PA. Oliva
 * @custom:experimental This is an experimental contract.
 */
contract Subscriptions is Ownable, Pausable{

    /* State variables */
    struct Plan {
        address payable publisher;
        uint fee;
        uint duration;
    }
    struct Subscription {
        address subscriber;
        uint startDate;
        uint endDate;
        uint pauseDate;
    }
    mapping(address => mapping(uint => Subscription)) public subscriptions;  // (subscriber -> (planId -> Subscription))
    mapping(uint => Plan) public plans; // (planId -> Plan)
    uint public nextPlanId;

    /* Events - publicize actions to external listeners */

    /**
     * @notice Log: `publisher` created plan `planId` by `publisher` at time `timestamp`
     * @param publisher Publisher address
     * @param planId Plan ID
     * @param timestamp Block timestamp
     */
    event PlanCreated(address publisher, uint planId, uint timestamp);

    /**
     * @notice Log: `subscriber` subscribed to plan `planId` at time `timestamp`
     * @param subscriber Subscriber address
     * @param planId Plan ID
     * @param timestamp Block timestamp
     */
    event Subscribed(address subscriber, uint planId, uint timestamp);

    /**
     * @notice Log: `subscriber` cancelled subscription to `planId` at time `timestamp`
     * @param subscriber Subscriber address
     * @param planId Plan ID
     * @param timestamp Block timestamp
     */
    event CancelledSubscription(address subscriber, uint planId, uint timestamp);

    /**
     * @notice Log: `subscriber` renewed subscription to `planId` at time `timestamp`
     * @param subscriber Subscriber address
     * @param planId Plan ID
     * @param timestamp Block timestamp
     */
    event RenewedSubscription(address subscriber, uint planId, uint timestamp);

    /**
     * @notice Log: `subscriber` paused subscription to `planId` at time `timestamp`
     * @param subscriber Subscriber address
     * @param planId Plan ID
     * @param timestamp Block timestamp
     */
    event PausedSubscription(address subscriber, uint planId, uint timestamp);

    /**
     * @notice Log: `subscriber` unpaused subscription to `planId` at time `timestamp`
     * @param subscriber Subscriber address
     * @param planId Plan ID
     * @param timestamp Block timestamp
     */
    event UnpausedSubscription(address subscriber, uint planId, uint timestamp);

    /* Modifiers */

    /**
     * @notice Require that the plan `planId` exists
     * @param planId Plan ID
     */
    modifier planExists(uint planId){
        require(
            planId < nextPlanId,
            "Plan does not exist"
        );
        _;
    }

    /**
     * @notice Require that msg.sender has subscribed to Plan `planId`
     * @param planId Plan ID
     */
    modifier hasSubscribed(uint planId) {
        require(
            subscriptions[msg.sender][planId].subscriber == msg.sender,
            "Has not subscribed yet"
        );
        _;
    }

    /**
     * @notice Require that msg.sender has an active subscription to Plan `planId`
     * @param planId Plan ID
     */
    modifier hasActiveSubscription(uint planId) {
        Subscription storage sub = subscriptions[msg.sender][planId];
        require(
            sub.subscriber == msg.sender,
            "Has not subscribed yet"
        );
        require(
            sub.pauseDate == 0,
            "Subscription is not active"
        );
        _;
    }

    /**
     * @notice Require that msg.sender has a paused subscription to Plan `planId`
     * @param planId Plan ID
     */
    modifier hasPausedSubscription(uint planId) {
        Subscription storage sub = subscriptions[msg.sender][planId];
        require(
            sub.subscriber == msg.sender,
            "Has not subscribed yet"
        );
        require(
            sub.pauseDate > 0,
            "Subscription is not active"
        );
        _;
    }

    /**
     * @notice Require that subscription has not expired
     * @param planId Plan ID
     */
    modifier hasNotExpired(uint planId) {
        Subscription storage sub = subscriptions[msg.sender][planId];
        require(
            sub.endDate > block.timestamp,
            "Subscription has expired"
        );
        _;
    }

    /**
     * @notice Require that msg.sender has not subscribed yet to Plan `planId`
     * @param planId Plan ID
     */
    modifier hasNotSubscribed(uint planId) {
        require(
            subscriptions[msg.sender][planId].subscriber == address(0),
            "Has already subscribed"
        );
        _;
    }

    /* Functions */
    /**
     * @notice Pause the contract if unpaused
     *
     * Requirements:
     * - Only from owner
     */
    function pauseContract() public onlyOwner() {
        super._pause();
    }

    /**
     * @notice Unpause the contract if paused
     *
     * Requirements:
     * - Only from owner
     */
    function unpauseContract() public onlyOwner() {
        super._unpause();
    }

    /**
     * @notice Create a new plan with fee `fee` and duration `durationDays`
     * @dev Emit PlanCreated
     * @param fee Subscription fee in gwei
     * @param durationDays Subscription term in days
     * @return ID of plan newly created
     */
    function createPlan(uint fee, uint durationDays) public returns (uint){
        require(durationDays > 0);
        uint id = nextPlanId;
        plans[id] = Plan({
            publisher: payable(msg.sender),
            fee: fee,
            duration: durationDays * 1 days
        });

        emit PlanCreated(msg.sender, id, block.timestamp);
        nextPlanId += 1;
        return id;
    }

    /**
     * @notice Subscribe to plan `planId`
     * @dev Emit Subscribed
     * @param planId Plan ID to subscribe to
     * @return ID of plan subscribed to
     *
     * Requirements:
     * - The plan exists
     * - Msg sender has not subscribed to it yet
     */
    function subscribe(uint planId) public payable planExists(planId) hasNotSubscribed(planId) whenNotPaused() returns (uint){ 
        Plan storage plan = plans[planId];

        // Register the subscription
        subscriptions[msg.sender][planId] = Subscription({
            subscriber: msg.sender,
            startDate: block.timestamp,
            endDate: block.timestamp + plan.duration,
            pauseDate: 0
        });

        // Transfer fee to the publisher
        (bool success, ) = plan.publisher.call{value: plan.fee}("");
        require(success, "Transfer failed.");

        // Emit log
        emit Subscribed(msg.sender, planId, block.timestamp);
        return planId;
    }

    /**
     * @notice Cancel subscription to plan `planId`
     * @dev Emit CancelledSubscription
     * @param planId Plan ID to subscribe to
     * @return Plan ID whose subscription is cancelled
     *
     * Requirements:
     * - Msg sender has a subscription to the plan
     */
    function cancelSubscription(uint planId) public hasSubscribed(planId) returns (uint){
        // Require that subscriber has subscribed to this plan already
        require(subscriptions[msg.sender][planId].subscriber == msg.sender);

        // Delete the subscription
        delete subscriptions[msg.sender][planId];
        emit CancelledSubscription(msg.sender, planId, block.timestamp);
        return planId;
    }

    /**
     * @notice Renew subscription to plan `planId`
     * @param planId Plan ID to renew subcription for
     * @return Subscription new end date
     *
     * Requirements:
     * - Msg sender has an active subscription to the plan
     */
    function renewSubscription(uint planId) public payable hasActiveSubscription(planId) whenNotPaused() returns(uint){
        // Renew subscription with startDate = max(block.timestamp, endDate)
        Plan storage plan = plans[planId];
        Subscription storage subscription = subscriptions[msg.sender][planId];

        // Renew or extend subscription by plan duration
        subscription.startDate = block.timestamp;
        subscription.endDate = Math.max(block.timestamp, subscription.endDate) + plan.duration;

        // Transfer fee to publisher
        (bool success, ) = plan.publisher.call{value: plan.fee}("");
        require(success, "Transfer failed.");

        emit RenewedSubscription(msg.sender, planId, subscription.startDate);
        return subscription.endDate;
    }

    /**
     * @notice Pause subscription to plan `planId`
     * @param planId Plan ID to pause subcription for
     * @return Subscription pause date
     *
     * Requirements:
     * - Msg sender has an active subscription to the plan
     * - The subscription has not expired
     */
    function pauseSubscription(uint planId) public payable hasActiveSubscription(planId) hasNotExpired(planId) returns(uint){
        Subscription storage subscription = subscriptions[msg.sender][planId];
        subscription.pauseDate = block.timestamp;
        emit PausedSubscription(msg.sender, planId, subscription.pauseDate);
        return subscription.pauseDate;
    }

    /**
     * @notice Unpause subscription to plan `planId`
     * @dev This pushes the subscription end date back by the duration of the pause
     * @param planId Plan ID to pause subcription for
     * @return Subscription new end date
     *
     * Requirements:
     * - Msg sender has a paused subscription to the plan
     */
    function unpauseSubscription(uint planId) public payable hasPausedSubscription(planId) returns(uint){
        Subscription storage subscription = subscriptions[msg.sender][planId];
        subscription.endDate = subscription.endDate + (block.timestamp - subscription.pauseDate);
        subscription.pauseDate = 0;
        emit UnpausedSubscription(msg.sender, planId, subscription.pauseDate);
        return subscription.endDate;
    }

}