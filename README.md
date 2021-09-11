# Idea 1: A la carte subscription

Implement a subscription platform enabling creators (in the most general sense, referred to as content providers CP below) to monetize their content and users to unlock exclusive access to their favourite creators' content for a given period of time against a fee.  

We aim to provide a platform (front-end + smart-contract `C`) enabling content providers with a fee plan in mind to call our smart contract `C` and create another, unique, dedicated smart contract `D` to act as intermediary between them and their subscribers. The fee plan would define a trial period length, subscription tiers (we'll limit ourselves to a single tier to begin with), and a fee schedule (flat yearly fee to start with, but more complex schedules could be set up encouraging long-term commitment).  

Subscribers will be able to subscribe to a creator's content by transferring the adequate USDC amount to smart contract `D`. The interesting feature here is that the money does not go directly to the content provider, but is instead locked in the smart contract, initially remaining the subscriber's property and gradually (linearly in time?) shifting to being the content provider's property. An initial trial period can be set up whereby users may opt for a full refund should they wish to cancel their subscription short. At any point after this initial period, cancellation is still possible to recover the unspent portion of the subscription fee, the spent portion remaining the property of the content provider. The content provider can choose to withdraw the spent portion of fees at any time and frequency.  

Content providers could in theory be any person, group, DAO or company creating online content that users may be willing to pay for to get exclusive access to. As an example, a CP could indeed be a newspaper wanting to give exclusive content to paying readers, or a blogger, artist, etc.
A couple of requirements for content providers:  
- They own an Ethereum address
- Their content must be available via a webiste of their own, allowing users to sign in with their Ethereum wallet for identification. In a future when social media platforms would start allowing Ethereum authentication, social media content could be unlocked too: subscribers would be able to see premium tweets, Instagram posts, Youtube videos, etc. by signing in with their wallet.

This system has several interesting implications:  
- Enable creators to be paid directly for their content (in the future of Ethereum authentication, for their social media content too!), no third party.
- Enable users to subscribe in a pseudo anonymous way (no credit cared details, no email address) to subscribe to their favourite creators' exclusive content.
- Flexible subscription plans, with an embedded trial period and possibility to withdraw the unspent unsubscription fee at any point. No questions asked, ever.
- Even though the fee is paid upfront for the entirety of the subscription, the unspent money remains the property of the user at all times, available for withdrawal.
- Creator can withdraw the earned portion of the fee (pooled across all subscribers) at anytime.
- Maintain pseudo anonimity of subscribers, while also allowing creators to potentially further reward subscribers with NFTs or tokens in a straightforward manner.

## Workflow

- Content Provider enters our website, chooses a fee plan, initiates a transaction with our smart contract `C` to spin up their own smart contract `D`. Smart contract `D` is registered with `C`.
- Up to the content provider to do what is necessary on their website to identify subscribing wallets and filter contents based on subscription tier.
- Users come to our platform, choose an artist they wish to subscribe to, and transfer the money to smart contract `D`. Note: we choose probably think of a smarter way to do this, to avoid scams.
- At this point, they are identified as subscribers.
- Up until the end of the trial period, users can initiate a second transaction to cancel their subscription and receive a full refund (minus gas fees).
- Users can also pause their subscription at any point.
- Once the trial period ends, the CP starts being paid and the fee gets split between a spent portion (available for CP to withdraw at any point) and an unspent portion (remaining the property of subscribers, can be withdrawn at any time). As time goes by, money gradually flows from the unspent to the spent portion.
- Content provider can at any time call a self-destruct method. The unspent fees gets transferred back to subscribers, the spent fees get transferred to the content provider wallet.