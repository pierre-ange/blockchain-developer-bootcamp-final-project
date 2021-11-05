# Final Project - Blockchain Developer Bootcamp

This repository is home to my submission to the 2021 Consensys Blockchain Developer Bootcamp.  

*Status: **WIP***

# Subscription platform

## Description

Subscription platform enabling publishers to monetize their content and users to subscribe to publisher's content.  

## Workflow  
  1. Publisher creates a new plan: duration, fee in ETH.
  2. Subscriber can subscribe to a plan, by paying the fixed fee to the publisher.
  3. Subscriber can renew a subscription.
  4. Subscriber can cancel a subscription. As a start and to make things easier, there is no refund mechanism.
  5. Subscriber can pause a subscription, then activate it again when they wish to.

## Possible improvements
  1. Publisher does not get paid immediately, but via an accrual mechanism so that they can only redeem the full subscription fee at the end of the term. This should allow the following two improvements:  
     a. Allow cancellation refunds (via mechanism discussed in point 1.)  
     b. Allow publisher to terminate a plan. Non-accrued fees are then sent back to subscribers' wallets.
  2. Allow payments in ERC20 token instead of ETH (DAI for example)

# Directory Structure

# Front-End Access

# Bootcamp checklist

- [x] Follow this naming format: https://github.com/YOUR_GITHUB_USERNAME_HERE/blockchain-developer-bootcamp-final-project
  
- [ ] Contain a [README.md](.README.md) file which describes:
  - [ ] the project, 
  - [ ] the directory structure, and 
  - [ ] where the frontend project can be accessed? 
  - [ ] *optional* public Ethereum address if you'd like your certification as an NFT?
  
- [ ] Contain smart contract(s) which:
  - [x] Are commented to the specs described by NatSpec Solidity documentation
  - [ ] Use at least 2 design patterns from the "Smart Contracts" section:
    - [ ] Inter-Contract Execution (Calling functions in external contracts) 
    - [ ] Inheritance and Interfaces (Importing and extending contracts and/or using contract interfaces) 
    - [ ] Oracles (retrieving third-party data)
    - [ ] Access Control Design Patterns
    - [ ] Upgradable Contracts
    - [ ] Optimizing Gas
  - [ ] Protect against 2 attack vectors from the "Smart Contracts" section with its the [SWC number](https://swcregistry.io/). 
  - [x] Inherits from at least one library or interface
  - [ ] Can be easily compiled, migrated and tested
  
- [ ] Contain a Markdown file named [design_pattern_decisions.md](./design_pattern_decisions.md) and [avoiding_common_attacks.md](/avoiding_common_attacks.md)

- [x] Have at least five smart contract unit tests that pass

- [ ] Contain a [deployed_address.txt](./deployed_address.txt) file which contains the testnet address and network where your contract(s) have been deployed
  
- [ ] Have a frontend interface built with a framework like React or HTML/CSS/JS that:
  - [ ] Detects the presence of MetaMask
  - [ ] Connects to the current account
  - [ ] Displays information from your smart contract
  - [ ] Allows a user to submit a transaction to update smart contract state
  - [ ] Updates the frontend if the transaction is successful or not
  
- [ ] Hosted on Github Pages, Heroku, Netlify, Fleek, or some other free frontend service that gives users a public interface to your decentralized application? (That address should be in your README.md document)

- [ ] Have clear instructions for: 
  - [ ] Installing dependencies for your project 
  - [ ] Accessing or - if your project needs a server (not required) - running your project
  - [ ] Running your smart contract unit tests and which port a local testnet should be running on. 
  
- [ ] A screencast of you walking through your project, including submitting transactions and seeing the updated state. You can use a screenrecorder of your choosing or something like Loom, and you can share the link to the recording in your README.md.