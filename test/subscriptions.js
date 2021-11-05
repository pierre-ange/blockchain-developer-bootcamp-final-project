
const { constants, time } = require('@openzeppelin/test-helpers');
let { catchRevert } = require("./exceptionsHelpers.js");
let BN = web3.utils.BN

const Subscriptions = artifacts.require("Subscriptions");
const toUTC = function(x) {return new Date(Number(x)*1000).toUTCString()};

contract("Subscriptions", function (accounts) {
  const [contractOwner, alice, bob] = accounts;
  const eth1 = web3.utils.toBN(1e18);
  const eth100 = web3.utils.toBN(100e18);

  const fee = eth1;
  const durationDays = web3.utils.toBN(365);

  beforeEach(async () => {
    instance = await Subscriptions.new();
  });

  describe("Setup", async function(){
    // The contract is deployed
    it("is deployed", async function () {
      await Subscriptions.deployed();
      return assert.isTrue(true);
    });

    // Alice and Bob start with 100 ETH
    it("is ready to be solved", async function() {
      assert.equal(await web3.eth.getBalance(alice), eth100.toString());
      assert.equal(await web3.eth.getBalance(bob), eth100.toString());
    });
  });

  // Create a plan
  describe("Create a plan", async function(){
    it("should have nextPlanId=0 before any plan creation", async function() {
      assert.equal(await instance.nextPlanId(), 0, "nextPlanId should be 0");
    });

    it("should register the new plan", async function() {
      // Create a plan
      await instance.createPlan(fee, durationDays, {from: alice});

      // Check new plan attributes
      const alicePlan = await instance.plans(0, {from: alice});
      assert.equal(alicePlan.fee.toString(), fee.toString(), "Fee incorrect");
      assert.equal(alicePlan.duration, durationDays * 3600 * 24, "Duration days incorrect");
    });

    it("should emit PlanCreated event", async function() {
      const res = await instance.createPlan(fee, durationDays, {from: alice});

      // Check event attributes
      const eventName = res.logs[0].event;
      const publisherAddress = res.logs[0].args.publisher;
      const planId = res.logs[0].args.planId.toNumber();
      assert.equal(eventName, "PlanCreated", "PlanCreated event not submitted, check createPlan method")
      assert.equal(publisherAddress, alice, "PlanCreated event publisher property not emitted correctly, check createPlan method");
      assert.equal(planId, 0, "PlanCreated event planId property not emitted correctly, check createPlan method")
    });

    it("should increment nextPlanId by 1 at each plan creation", async function() {
      // Check nextPlanId before any plan gets created
      assert.equal(await instance.nextPlanId(), 0, "nextPlanId should be 0, check createPlan method");

      // Create a first plan and check nextPlanId again
      await instance.createPlan(fee, durationDays, {from: alice});
      assert.equal(await instance.nextPlanId(), 1, "nextPlanId should be 1, check createPlan method");

      // Create a second plan and check nextPlanId again
      await instance.createPlan(fee, durationDays, {from: bob});
      assert.equal(await instance.nextPlanId(), 2, "nextPlanId should be 2, check createPlan method");
    });
  });

  describe("Subscribe to a plan", async function(){
    it("should not allow to subscribe to a plan that does not exist", async function(){
      // Try subscribe to a plan that does not exist
      await catchRevert(instance.subscribe(0, {from:bob, value:fee}));
    });

    it("should not allow to subscribe if not enough value sent", async function(){
      // Try subscribe to a plan without sending ETH
      await instance.createPlan(fee, durationDays, {from: alice});
      await catchRevert(instance.subscribe(0, {from: bob, value: 0}));
    });

    it("should not allow to subscribe if already subscribed", async function(){
      await instance.createPlan(fee, durationDays, {from: alice});
      // Subscribe a first time
      await instance.subscribe(0, {from:bob, value:fee});
      // Try subscribe a second time
      await catchRevert(instance.subscribe(0, {from:bob, value:fee}));
    });

    it("should register a new subscription", async function(){
      // Create plan and save Alice and Bob's balances
      await instance.createPlan(fee, durationDays, {from: alice});
      var aliceBalanceBefore = await web3.eth.getBalance(alice);
      var bobBalanceBefore = await web3.eth.getBalance(bob);

      // Subscribe and save subscription time
      const res = await instance.subscribe(0, {from:bob, value:fee});
      const subscriptionDate = (await web3.eth.getBlock(res.receipt.blockNumber)).timestamp;

      // Check Alice and Bob's balances after Bob's subscription
      var aliceBalanceAfter = await web3.eth.getBalance(alice);
      var bobBalanceAfter = await web3.eth.getBalance(bob);

      // Bob's balance gets reduced by more than the fee (incl. gas cost)
      assert.isBelow(
        Number(new BN(bobBalanceAfter)),
        Number(new BN(bobBalanceBefore).sub(new BN(fee))),
        "Bob balance should be reduced by more than the fee (incl. gas costs), check subscribe method"
      );
      
      // Alice's balance gets increased by the fee
      assert.equal(
        new BN(aliceBalanceAfter).toString(),
        new BN(aliceBalanceBefore).add(new BN(fee)).toString(),
        "Alice balance should be increased by the subscription fee, check subscribe method"
      )
      
      // Check subscription properties
      const expectedEndDate = new BN(subscriptionDate).add(new BN(time.duration.days(durationDays)));
      const sub = await instance.subscriptions(bob, 0);
      assert.equal(sub.subscriber, bob, "subscriber should be bob, check subscribe method");
      assert.equal(toUTC(sub.startDate), toUTC(subscriptionDate), "start date should be the block timestamp");
      assert.equal(toUTC(sub.endDate), toUTC(expectedEndDate), "incorrect endDate");
      assert.equal(new BN(sub.pauseDate).toString(), new BN(0).toString(), "pauseDate should be 0");
    });

    it("should emit a Subscribed event", async function(){
      await instance.createPlan(fee, durationDays, {from: alice});
      const res = await instance.subscribe(0, {from:bob, value:fee});

      const eventName = res.logs[0].event;
      const subscriber = res.logs[0].args.subscriber;
      assert.equal(eventName, "Subscribed", "Subscribed event not submitted, check subscribe method");
      assert.equal(subscriber, bob, "Subscribed event subscriber property not emitted correctly, check subscribe method");
    });
  });

  describe("Cancel a subscription", async function(){
    it("should not allow cancellation if plan does not exist", async function(){
      // Try cancel a subscription for a plan that does not exist
      await catchRevert(instance.cancel(0, {from:bob}));
    })

    it("should not allow cancellation if no subscription", async function(){
      // Try cancel a subscription that does not exist
      await instance.createPlan(fee, durationDays, {from: alice});
      await catchRevert(instance.cancel(0, {from:bob}));
    })

    it("should cancel the plan", async function(){
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});
      await instance.cancel(0, {from: bob})

      const sub = await instance.subscriptions(bob, 0);
      assert.equal(sub.subscriber, constants.ZERO_ADDRESS);
    })

    it("should emit Cancelled event", async function(){
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});
      const res = await instance.cancel(0, {from: bob})

      const log = res.logs[0];
      assert.equal(log.event, "Cancelled", "Cancelled event is not emitted")
      assert.equal(log.args.subscriber, bob, "Subscriber should be Bob");
      assert.equal(log.args.planId, 0, "Plan ID should be 0");
    })

  });

  describe("Pause a subscription", async function(){
    it("should not allow pause if plan does not exist", async function(){
      // Try pause a subscription for a plan that does not exist
      await catchRevert(instance.pause(0, {from:bob}));
    })

    it("should not allow pause if no subscription", async function(){
      // Try pause a subscription that does not exist
      await instance.createPlan(fee, durationDays, {from: alice});
      await catchRevert(instance.pause(0, {from:bob}));
    })

    it("should not allow pause if subscription paused already", async function(){
      // Try pause a subscription that is already paused
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});

      // Pause it a first time
      await instance.pause(0, {from: bob});

      // Try to pause it a second time
      await catchRevert(instance.pause(0, {from: bob}));
    })

    it("should not allow pause if subscription has expired", async function(){
      // Try pause a subscription that has expired
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});

      // Let the subscription expire
      await time.increase(time.duration.days(Number(durationDays.add(new BN(1)))));

      // Try to pause it
      await catchRevert(instance.pause(0, {from: bob}));
    })

    it("should pause the plan", async function(){
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});

      // Pause the plan and get the timestamp
      res = await instance.pause(0, {from: bob})
      const ts = (await web3.eth.getBlock(res.receipt.blockNumber)).timestamp;

      // Check that pause date is correctly assigned to subscription
      const sub = await instance.subscriptions(bob, 0);
      assert.equal(sub.subscriber, bob, "Subscriber should be Bob");
      assert.equal(toUTC(sub.pauseDate), toUTC(ts), "pause date should be the block timestamp");
    })

    it("should emit Paused event", async function(){
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});
      const res = await instance.pause(0, {from: bob})

      const log = res.logs[0];
      assert.equal(log.event, "Paused", "Paused event is not emitted")
      assert.equal(log.args.subscriber, bob, "Subscriber should be Bob");
      assert.equal(log.args.planId, 0, "Plan ID should be 0");
    })
  });

  describe("Unpause a subscription", async function(){
    it("should not allow unpause if plan does not exist", async function(){
      // Try unpause a subscription for a plan that does not exist
      await catchRevert(instance.unpause(0, {from:bob}));
    })

    it("should not allow unpause if no subscription", async function(){
      // Try unpause a subscription that does not exist
      await instance.createPlan(fee, durationDays, {from: alice});
      await catchRevert(instance.unpause(0, {from:bob}));
    })

    it("should not allow unpause if subscription not on pause", async function(){
      // Try unpause a subscription that is not on pause
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});
      await catchRevert(instance.unpause(0, {from: bob}));
    })

    it("should unpause the plan", async function(){
      // Create a planm subcribe and save the initial end date
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});
      const initialEndDate = (await instance.subscriptions(bob, 0)).endDate;
      
      // Let some time pass and pause 1 day before expiry
      await time.increase(time.duration.days(Number(durationDays.sub(new BN(1)))));
      res = await instance.pause(0, {from: bob, value: fee});
      const pausedAt = (await web3.eth.getBlock(res.receipt.blockNumber)).timestamp;

      // Let 100 days pass and unpause. Save the unpause date.
      await time.increase(time.duration.days(100));
      res = await instance.unpause(0, {from: bob})
      const unpausedAt = (await web3.eth.getBlock(res.receipt.blockNumber)).timestamp;

      // Check subscription attributes and in particular new pause and end dates
      const expectedNewEndDate = new BN(initialEndDate).add(new BN(unpausedAt)).sub(new BN(pausedAt));
      const sub = await instance.subscriptions(bob, 0);
      assert.equal(sub.subscriber, bob, "Bob should be the subscriber");
      assert.equal(new BN(sub.pauseDate).toString(), "0", "pause date should be 0");
      assert.equal(toUTC(sub.endDate), toUTC(expectedNewEndDate), "endDate is not as expected");
    })

    it("should emit Unpaused event", async function(){
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});
      await instance.pause(0, {from: bob})
      const res = await instance.unpause(0, {from: bob})

      const log = res.logs[0];
      assert.equal(log.event, "Unpaused", "Unpaused event is not emitted")
      assert.equal(log.args.subscriber, bob, "Subscriber should be Bob");
      assert.equal(log.args.planId, 0, "Plan ID should be 0");
      assert.equal(log.args.timestamp, 0, "Pause date should be 0");
    })
  });

  describe("Renew a subscription", async function(){
    it("should not allow renew if plan does not exist", async function(){
      // Try renew a subscription for a plan that does not exist
      await catchRevert(instance.renew(0, {from:bob}));
    })

    it("should not allow renew if no subscription", async function(){
      // Try renew a subscription that does not exist
      await instance.createPlan(fee, durationDays, {from: alice});
      await catchRevert(instance.renew(0, {from:bob}));
    })

    it("should not allow renew if subscription is paused", async function(){
      // Try renew a subscription that is paused
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from:bob, value:fee});
      await instance.pause(0, {from:bob});
      await catchRevert(instance.renew(0, {from:bob}));
    });

    it("should renew if not expired", async function(){
      // Renew a subscription before expiry (this is allowed)
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from:bob, value:fee});

      // Get end date, Alice and Bob's balances before renewal
      var initialEndDate = (await instance.subscriptions(bob, 0)).endDate;
      var aliceBalanceBefore = await web3.eth.getBalance(alice);
      var bobBalanceBefore = await web3.eth.getBalance(bob);

      // Renew and get renewal date
      res = await instance.renew(0, {from:bob, value:fee})
      renewalDate = (await web3.eth.getBlock(res.receipt.blockNumber)).timestamp;

      // Get Alice and Bob's balances after renewal
      var aliceBalanceAfter = await web3.eth.getBalance(alice);
      var bobBalanceAfter = await web3.eth.getBalance(bob);

      // Bob's balance gets reduced by more than the fee (incl. gas cost)
      assert.isBelow(
        Number(new BN(bobBalanceAfter)),
        Number(new BN(bobBalanceBefore).sub(new BN(fee))),
        "Bob balance should be reduced by more than the fee (incl. gas costs)"
      );
      
      // Alice's balance gets increased by the fee
      assert.equal(
        new BN(aliceBalanceAfter).toString(),
        new BN(aliceBalanceBefore).add(new BN(fee)).toString(),
        "Alice balance should be increased by the subscription fee"
      )
      
      // Test that start and end dates are ok
      const sub = await instance.subscriptions(bob, 0);
      assert.equal(toUTC(sub.startDate), toUTC(renewalDate)), "Start date should equal the renewal date";
      assert.equal(toUTC(sub.endDate), toUTC(new BN(initialEndDate).add(new BN(time.duration.days(durationDays)))), "End date should be pushed back by the expected number of days");
    });

    it("should renew if expired", async function(){
      // Renew a subscription after expiry (this is allowed)
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from:bob, value:fee});

      // Get Alice and Bob's balances before renewal
      var aliceBalanceBefore = await web3.eth.getBalance(alice);
      var bobBalanceBefore = await web3.eth.getBalance(bob);

      // Let the subscription expire
      await time.increase(time.duration.days(Number(durationDays.add(new BN(1)))));
      res = await instance.renew(0, {from:bob, value:fee})
      renewalDate = (await web3.eth.getBlock(res.receipt.blockNumber)).timestamp;

      // Get Alice and Bob's balances after renewal
      var aliceBalanceAfter = await web3.eth.getBalance(alice);
      var bobBalanceAfter = await web3.eth.getBalance(bob);

      // Bob's balance gets reduced by more than the fee (incl. gas cost)
      assert.isBelow(
        Number(new BN(bobBalanceAfter)),
        Number(new BN(bobBalanceBefore).sub(new BN(fee))),
        "Bob balance should be reduced by more than the fee (incl. gas costs)"
      );
      
      // Alice's balance gets increased by the fee
      assert.equal(
        new BN(aliceBalanceAfter).toString(),
        new BN(aliceBalanceBefore).add(new BN(fee)).toString(),
        "Alice balance should be increased by the subscription fee"
      )
      
      // Test that start and end dates are ok
      const sub = await instance.subscriptions(bob, 0);
      assert.equal(toUTC(sub.startDate), toUTC(renewalDate)), "Start date should equal the renewal date";
      assert.equal(toUTC(sub.endDate), toUTC(new BN(renewalDate).add(new BN(time.duration.days(durationDays)))), "End date should be pushed back by the expected number of days");
    });

    it("should emit Renewed event", async function(){
      await instance.createPlan(fee, durationDays, {from: alice});
      await instance.subscribe(0, {from: bob, value: fee});
      const res = await instance.renew(0, {from: bob, value:fee});
      const renewalDate = (await web3.eth.getBlock(res.receipt.blockNumber)).timestamp;

      const log = res.logs[0];
      assert.equal(log.event, "Renewed", "Renewed event is not emitted")
      assert.equal(log.args.subscriber, bob, "Subscriber should be Bob");
      assert.equal(log.args.planId, 0, "Plan ID should be 0");
      assert.equal(log.args.timestamp, renewalDate, "timestamp should be renewal date");
    })
  });
});
