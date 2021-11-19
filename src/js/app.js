const shortenAddress = (address, num = 3) => {
  if (!address) return '';
  return !!address && `${address.substring(0, num + 2)}...${address.substring(address.length - num - 1)}`;
};

const supportedChainIds = {3: "Ropsten", 1337: "Ganache test"};

App = {
  web3Provider: null,
  contracts: {},
  accounts: [],
  chain: null,

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is installed!');
      App.web3Provider = window.ethereum;
    }
    web3 = new Web3(App.web3Provider); // Connect Metamask to our web3 object
    BN = web3.utils.BN;
    hexToNumber = web3.utils.hexToNumber
    await App.initContract();
    App.bindEvents();
  },

  initContract: async function() {
    await $.getJSON('Subscriptions.json', function(data) {
      App.contracts.Subscriptions = TruffleContract(data);
      App.contracts.Subscriptions.setProvider(App.web3Provider);
    });

    // Get accounts
    await App.web3Provider
      .request({ method: 'eth_accounts' })
      .then(App.onAccountsChanged)
      .catch((err) => {
        // Some unexpected error.
        // For backwards compatibility reasons, if no accounts are available,
        // eth_accounts will return an empty array.
        console.error(err);
      });

    // Get chain id
    App.web3Provider
      .request({ method: 'eth_chainId' })
      .then((chainId) => {
        chainId = hexToNumber(chainId);
        var chainName = supportedChainIds[chainId];
        var isSupported = (typeof chainName !== "undefined");

        const showChain = document.querySelector('.showChain')
        if(isSupported){
          showChain.innerHTML = chainName;
          showChain.classList.remove("text-danger");
        } else {
          showChain.innerHTML = "Please switch to Ropsten";
          showChain.classList.add("text-danger");
        }
      })
      .catch((err) => {
        console.error(err);
      });
  },

  bindEvents: function() {
    // User clicks on Connect Wallet button
    $(document).on('click', '.enableEthereumButton', App.connectWallet);

    // Account changes
    App.web3Provider.on('accountsChanged', App.onAccountsChanged);

    // Chain changes
    App.web3Provider.on('chainChanged', App.onChainChanged);

    // Create Plan form submit
    $(document).on('submit', 'form.createPlan', App.handleCreatePlan);

    // Subscribe button click
    $("button.subscribe").on('click', App.handleSubscribe);

    // Reload button
    $("button.reload").on("click", () => window.location.reload());
  },

  onAccountsChanged: async function (accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== App.accounts[0]) {
      App.accounts = accounts;
      document.querySelector('.showAccount').innerHTML = shortenAddress(App.accounts[0]);
      await App.showAccountData(App.accounts[0]);
      $("button.subscribe").on('click', App.handleSubscribe);
      App.enableCreatePlanForm();
    }
  },

  onChainChanged: function (chainId) {
    window.location.reload();
  },

  connectWallet: async function(){
    App.web3Provider
      .request({ method: 'eth_requestAccounts' })
      .then(App.onAccountsChanged)
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to MetaMask.');
        } else {
          console.error(err);
        }
      });
  },

  enableCreatePlanForm: async function(){
    // Enable form to cretae a plan (which is disabled by default on page loading)
    $('form.createPlan > fieldset').prop("disabled", false);
  },

  handleCreatePlan: async function(e){
    // Function called once user submits the form to create a new plan
    e.preventDefault();
    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);
  
    const fee = new BN(web3.utils.toWei(formProps.fee, "ether"));
    const durationDays = new BN(formProps.durationDays);
    await App.createPlan(fee, durationDays);
  },

  createPlan: async function(fee, durationDays){
    // Create a plan with fee and durationDays
    var instance = await App.contracts.Subscriptions.deployed();
    instance.createPlan(fee, durationDays, {from: App.accounts[0]})
      .once('sending', function(payload){ console.log("sending " + payload) })
      .once('sent', function(payload){ console.log("sent " + payload) })
      .once('transactionHash', function(hash){ console.log("transactionHash " + hash); $("#sentModal").modal("show"); })
      .once('receipt', function(receipt){ console.log("receipt " + receipt); $("#receiptModal").modal("show"); })
      .on('confirmation', function(confNumber, receipt, latestBlockHash){ console.log("confirmation " + receipt + confNumber + latestBlockHash) })
      .on('error', function(error){ console.log("error " + error) })
      .then(function(receipt){
          console.log(receipt)
      });
  },

  handleSubscribe: async function(e){
    e.preventDefault();
    const planId = parseInt(e.target.id);
    let fee = $(e.target).closest("tr").children().eq(2).text() // Read fee on same row as button
    fee = new BN(web3.utils.toWei(fee, "ether"))
    await App.subscribe(planId, fee);
  },

  subscribe: async function(planId, fee){
    var instance = await App.contracts.Subscriptions.deployed();
    instance.subscribe(planId, {from:App.accounts[0], value:fee})
      .once('sending', function(payload){ console.log("sending " + payload) })
      .once('sent', function(payload){ console.log("sent " + payload) })
      .once('transactionHash', function(hash){ console.log("transactionHash " + hash); $("#sentModal").modal("show"); })
      .once('receipt', function(receipt){ console.log("receipt " + receipt); $("#receiptModal").modal("show"); })
      .on('confirmation', function(confNumber, receipt, latestBlockHash){ console.log("confirmation " + receipt + confNumber + latestBlockHash) })
      .on('error', function(error){ console.log("error " + error) })
      .then(function(receipt){
          console.log(receipt)
      });
  },

  showAccountData: async function(account){
    let accountSubscriptions = await App.getAccountSubscriptions(account);
    let accountPlans = await App.getPlans(account);
    let allPlans = await App.getPlans(-1)

    let planIdsSubscribedTo = accountSubscriptions.map(x => x.planId);
    let plansNotSubscribedTo = []
    for(plan of allPlans){
      if(
        !planIdsSubscribedTo.includes(plan.planId) && // Plan not subscribed to yet
        plan.publisher.toUpperCase() !== account.toUpperCase() // Plan is not own's plan (why subscribe to one's own account?)
      )
        plansNotSubscribedTo.push(plan);
    }

    App.showAccountSubscriptions(accountSubscriptions);
    App.showAccountPlans(accountPlans);
    App.showAllPlans(plansNotSubscribedTo);
  },

  getAccountSubscriptions: async function(account){
    var instance = await App.contracts.Subscriptions.deployed();
    var nextPlanId = await App.getNextPlanId();
    console.log("nextPlanId " + nextPlanId);
    let subs = [];

    // Get list of account's subscriptions
    for(let i=0; i<nextPlanId; i++){
      let sub = await instance.subscriptions(account, i);
      if(sub.subscriber !== "0x0000000000000000000000000000000000000000"){
        sub.planId = i;
        subs.push(sub);
      }
    }
    return subs
  },

  showAccountSubscriptions: async function(subs){
    // Reset Subscriptions section of the webpage
    document.getElementById("accountSubsNoneMsg").classList.remove("d-none");
    document.getElementById("accountSubsTbl").classList.add("d-none");
    $('#accountSubsTbl > tbody').html("");

    // Populate subscriptions table on the webpage
    if(subs.length!==0){
      document.getElementById("accountSubsTbl").classList.remove("d-none");
      for(const sub of subs){
        $('#accountSubsTbl').find("tbody").append(
          '<tr>' + 
          '<td>' + sub.planId + '</td>' +
          '<td>' + (new Date(sub.startDate*1000)).toUTCString().substring(5) + '</td>' + // Datetime with weekday removed
          '<td>' + (new Date(sub.endDate*1000)).toUTCString().substring(5) + '</td>' + // Datetime with weekday removed
          // '<td>' + sub.pauseDate + '</td>' +
          '</tr>'
          );
      }
    }
  },

  getPlans: async function(account){
    // Return list of plans created by account address, or list of all plans if account===-1
    var instance = await App.contracts.Subscriptions.deployed();
    var nextPlanId = await App.getNextPlanId();
    let plans = [];

    // Get list of account's plans
    for(let i=0; i<nextPlanId; i++){
      let plan = await instance.plans(i);
      plan.planId = i;
      if(account === -1){
        plans.push(plan);
      }
      else if(plan.publisher.toUpperCase() === account.toUpperCase()){
        plans.push(plan);
      }
    }
    return plans
  },

  showAccountPlans: async function(plans){
    // Reset Plans section of the webpage
    document.getElementById("accountPlansNoneMsg").classList.remove("d-none");
    document.getElementById("accountPlansTbl").classList.add("d-none");
    $('#accountPlansTbl > tbody').html("");

    // Populate subscriptions table on the webpage
    if(plans.length!==0){
      document.getElementById("accountPlansTbl").classList.remove("d-none");
      document.getElementById("accountPlansNoneMsg").classList.add("d-none");
      for(const plan of plans){
        $('#accountPlansTbl').find("tbody").append(
          '<tr>' + 
          '<td>' + plan.planId + '</td>' +
          '<td class="d-none">' + plan.publisher + '</td>' +
          '<td>' + plan.fee/1e18 + '</td>' +
          '<td>' + plan.duration/24/3600 + '</td>' +
          '</tr>'
          );
      }
    }
  },

  showAllPlans: async function(plans){
    // Reset Plans section of the webpage
    document.getElementById("allPlansNoneMsg").classList.remove("d-none");
    document.getElementById("allPlansTbl").classList.add("d-none");
    $('#allPlansTbl > tbody').html("");

    // Populate subscriptions table on the webpage
    if(plans.length!==0){
      document.getElementById("allPlansTbl").classList.remove("d-none");
      document.getElementById("allPlansNoneMsg").classList.add("d-none");
      for(const plan of plans){
        $('#allPlansTbl').find("tbody").append(
          '<tr>' + 
          '<td>' + plan.planId + '</td>' +
          '<td>' + shortenAddress(plan.publisher) + '</td>' +
          '<td>' + plan.fee/1e18 + '</td>' +
          '<td>' + plan.duration/24/3600 + '</td>' +
          '<td><button id="' + plan.planId + '" class="btn btn-sm btn-success subscribe">Subscribe</button></td>' +
          '</tr>'
          );
      }
    }
  },

  getNextPlanId: async function(){
    var instance = await App.contracts.Subscriptions.deployed();
    return await instance.nextPlanId();
  },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
