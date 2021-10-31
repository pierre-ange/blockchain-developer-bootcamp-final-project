// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Subscriptions {

    /* State variables */
    struct Plan {
        address payable publisher;
        uint fee;
        uint durationDays;
    }
    struct Subscription {
        address subscriber;
        uint startDate;
        uint endDate;
    }
    mapping(address => mapping(uint => Subscription)) subscriptions;  // (subscriber -> (planId -> Subscription))
    mapping(uint => Plan) plans; // (planId -> Plan)
    uint nextPlanId;

    /* Events - publicize actions to external listeners */
    event PlanCreated(address publisher, uint planId, uint date);
    event Subscribed(address subscriber, uint planId, uint date);
    event Cancelled(address subscriber, uint planId, uint date);
    event Paused(address subscriber, uint planId, uint date);
    event Unpaused(address subscriber, uint planId, uint date);

    /* Modifiers */
    // Require that msg.sender has subscribed to Plan planId
    modifier hasSubscribed(uint planId) {
        require(
            subscriptions[msg.sender][planId].subscriber == msg.sender,
            "Has not subscribed yet"
        );
        _;
    }

    // Require that msg.sender has not subscribed yet to Plan planId
    modifier hasNotSubscribed(uint planId) {
        require(
            subscriptions[msg.sender][planId].subscriber == address(0),
            "Has already subscribed"
        );
        _;
    }

    /* Functions */ 
    function createPlan(uint fee, uint durationDays) public returns (uint){
        uint id = nextPlanId;

        plans[id] = Plan({
            publisher: payable(msg.sender),
            fee: fee,
            durationDays: durationDays * 1 days
        });
        nextPlanId ++;

        emit PlanCreated(msg.sender, id, block.timestamp);
        return id;
    }

    function subscribe(uint planId) public payable hasNotSubscribed(planId) returns (uint){ 
        Plan storage plan = plans[planId];

        // Transfer fee to the publisher
        plan.publisher.transfer(plan.fee);

        // Register the subscription
        subscriptions[msg.sender][planId] = Subscription({
            subscriber: msg.sender,
            startDate: block.timestamp,
            endDate: block.timestamp + plan.durationDays
        });

        // Emit log
        emit Subscribed(msg.sender, planId, block.timestamp);

        return planId;
    }

    function cancel(uint planId) public hasSubscribed(planId) returns (uint){
        // Require that subscriber has subscribed to this plan already
        require(subscriptions[msg.sender][planId].subscriber == msg.sender);

        // Delete the subscription
        delete subscriptions[msg.sender][planId];
        emit Cancelled(msg.sender, planId, block.timestamp);
        return planId;
    }

    function renew(uint planId) public payable hasSubscribed(planId) returns(uint){
        // Require that subscriber has subscribed to this plan already
        require(subscriptions[msg.sender][planId].subscriber == msg.sender);

        // Renew subscription with startDate = max(block.timestamp, endDate)
        Plan storage plan = plans[planId];
        Subscription storage subscription = subscriptions[msg.sender][planId];

        // Transfer fee to publisher
        plan.publisher.transfer(plan.fee);

        // Renew or extend subscription by plan duration
        subscription.startDate = block.timestamp;
        subscription.endDate = Math.max(block.timestamp, subscription.endDate) + plan.durationDays;
        return subscription.endDate;
    }

}