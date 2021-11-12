# Design Pattern Decisions

The contract uses the following design patterns:  
 - Inheritance of the Ownable and Pausable contracts from OpenZeppelin.
 - [Ownable](https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable) to restrict the ability to pause and unpause the contract to the contract owner only.
 - [Pausable](https://docs.openzeppelin.com/contracts/4.x/api/security#Pausable) as a simple emergency stop mechanim which can be triggered by the contract owner. Once paused, all operations involving a payment (subscribe, renewSubscription) are no longer possible until the owner unpauses the contract.