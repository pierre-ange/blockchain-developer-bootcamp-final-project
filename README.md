# Final Project - Blockchain Developer Bootcamp

This repository is home to my submission to the 2021 Consensys Blockchain Developer Bootcamp.  

# Subscription platform

## Deployed URL

[https://jovial-swartz-4d20ab.netlify.app](https://jovial-swartz-4d20ab.netlify.app)

## Description

Platform for publishers to create subscription plans and users to subscribe to a plan.  
The smart contract (and our front-end) handle all the subscription workflow across all publishers and subscribers.  
This would allow publishers (via their own website) to identify their set of subscribers (via on-chain data) and give them access to restricted content (similar to how a paywall works).

## Workflow  
  1. Publisher creates a new plan: duration, fee in ETH.
  2. Subscriber can subscribe to a plan, by paying the fixed fee to the publisher.
  3. Subscriber can renew a subscription. 
  4. Subscriber can cancel a subscription. As a start and to make things easier, there is no refund mechanism.
  5. Subscriber can pause a subscription, then activate it again when they wish to.

Steps 3, 4 and 5 are implemented in the smart contract but are not (yet) available in the front-end.

## Possible improvements (not implemented)
  1. Expose steps 3, 4 & 5 of the workflow above in the front-end.
  2. Allow payments in ERC20 tokens instead of ETH (DAI for example)
  3. Use Pull over Push for security reasons (the publisher should withdraw rather than being sent the fees directly). Or better:
  4. Publisher does not get paid immediately, but via an accrual mechanism so that they can only redeem the full subscription fee at the end of the term. This should allow the following two improvements:  
     a. Allow cancellation refunds (via mechanism discussed in point 1.)  
     b. Allow publisher to terminate a plan. Non-accrued fees are then sent back to subscribers' wallets.

## Screencast link

[https://youtu.be/-gq68TdBL7E](https://youtu.be/-gq68TdBL7E)

## Public Ethereum account for certification

`0x8DD00e9583ECaF9d71e2150C42728Ef794890760`

# Instructions for local testing

## Pre-requisites
- Node.js
- Truffle and Ganache
- `git checkout main`

## Contracts
 - `npm install`
 - Run local testnet in port 8545 with an Ethereum client, e.g. Ganache: `ganache-cli -p 8545`
 - `truffle migrate --network development`
 - `truffle test --network development`

## Front-end
 - `npm run dev`

## Environment variables (not needed for running project locally)

```
INFURA_URL=
MNEMONIC=
```

# Directory Structure

```
blockchain-developer-bootcamp-final-project
???   
????????????contracts
???   ???   Migrations.sol
???   ???   Subscriptions.sol       --> Our contract deployed on Ropsten!
???   
????????????migrations                  --> Migration scripts to deploy contracts
???   ???   1_initial_migration.js
???   ???   2_deploy_subscriptions.js
???
????????????src                         --> Our front-end
???   ???   index.html
???   
????????????test
???   ???   exceptionHelpers.js
???   ???   subscriptions.test.js   --> Our tests!
???
???   README.md
???   avoiding_common_attacks.md  --> Describe protections taken against attack vectors
???   bs-config.json              --> Lite-server configuration
???   deployed_address.txt        --> Network & testnet address where contract is deployed
???   design_pattern_decisions.md --> Describe design pattern decisions
???   package-lock.json           --> Project dependency tree
???   package.json                --> Project requirements
???   truffle-config.js           --> Truffle config file
``` 

# Bootcamp checklist

- [x] Follow this naming format: https://github.com/YOUR_GITHUB_USERNAME_HERE/blockchain-developer-bootcamp-final-project
  
- [x] Contain a [README.md](.README.md) file which describes:
  - [x] the project, 
  - [x] the directory structure 
  - [x] where the frontend project can be accessed? 
  - [x] *optional* public Ethereum address if you'd like your certification as an NFT?
  
- [x] Contain smart contract(s) which:
  - [x] Are commented to the specs described by NatSpec Solidity documentation
  - [x] Use at least 2 design patterns from the "Smart Contracts" section
  - [x] Protect against 2 attack vectors from the "Smart Contracts" section with its [SWC number](https://swcregistry.io/). 
  - [x] Inherits from at least one library or interface
  - [x] Can be easily compiled, migrated and tested
  
- [x] Contain a Markdown file named [design_pattern_decisions.md](./design_pattern_decisions.md) and [avoiding_common_attacks.md](/avoiding_common_attacks.md)

- [x] Have at least five smart contract unit tests that pass

- [x] Contain a [deployed_address.txt](./deployed_address.txt) file which contains the testnet address and network where your contract(s) have been deployed
  
- [x] Have a frontend interface built with a framework like React or HTML/CSS/JS that:
  - [x] Detects the presence of MetaMask
  - [x] Connects to the current account
  - [x] Displays information from your smart contract
  - [x] Allows a user to submit a transaction to update smart contract state
  - [x] Updates the frontend if the transaction is successful or not
  
- [x] Hosted on Github Pages, Heroku, Netlify, Fleek, or some other free frontend service that gives users a public interface to your decentralized application

- [x] Have clear instructions for: 
  - [x] Installing dependencies for your project 
  - [x] Accessing or - if your project needs a server (not required) - running your project
  - [x] Running your smart contract unit tests and which port a local testnet should be running on. 
  
- [x] A screencast of you walking through your project, including submitting transactions and seeing the updated state. You can use a screenrecorder of your choosing or something like Loom, and you can share the link to the recording in your README.md.