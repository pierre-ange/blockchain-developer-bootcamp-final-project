# Avoiding Common Attacks

The following security measures introduced in the course are used in this projet:
- __Specific Compiler Pragma__: we've listed the compiler version as `0.8.9`, not including the `^`.
- __Proper use of `require`, `assert` and `revert`__: we've only used `require` as an input validation.
   `assert` and `revert` have not been used.
- __Use Modifiers only for Validation__: our modifiers only execute validation operations.
- __Proper use of call, delegatecall instead of send, transfer__: In the two `subscribe` and `renewSubscription` functions, we have used `call` instead of `transfer`.
- __Checks-Effects-Interactions__: state changes after external calls have been avoided. In the two `subscribe` and `renewSubscription` functions, the checks and state changes happen before the external call. This allows us to take protection against __[SWC-107](https://swcregistry.io/docs/SWC-107) Re-entrancy attacks__.
- __[SWC-101](https://swcregistry.io/docs/SWC-101) Integer Overflow/Underflow__: Using OpenZeppelin SafeMath module is no longer needed starting with Solidity 0.8 as the compiler now has buil in overflow checking.
- __[SWC-115](https://swcregistry.io/docs/SWC-115) tx.Origin Authentication__: we do not use `tx.origin` for authorization but `msg.sender` instead.