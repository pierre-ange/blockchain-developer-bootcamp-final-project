App = {
  web3Provider: null,
  contracts: {},
  accounts: [],

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is installed!');
      console.log('Network version: ' + window.ethereum.networkVersion);
      console.log('Selected address: ' + window.ethereum.selectedAddress);
      App.web3Provider = window.ethereum;
    }
    web3 = new Web3(App.web3Provider); // Connect Metamask to our web3 object
    BN = web3.utils.BN;
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Subscriptions.json', function(data) {
      App.contracts.Subscriptions = TruffleContract(data);
      App.contracts.Subscriptions.setProvider(App.web3Provider);
    
      // Use our contract to retrieve and mark the adopted pets
      // return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    // User clicks on Connect Wallet button
    $(document).on('click', '.enableEthereumButton', App.connectWallet);

    // Account changes: reload the account interface
    App.web3Provider.on('accountsChanged', App.onAccountsChanged);

    // Chain changes: reload the page
    App.web3Provider.on('chainChanged', (_chainId) => window.location.reload());

    // Create Plan form submit
    $(document).on('submit', 'form.createPlan', App.handleCreatePlan);
  },

  onAccountsChanged: async function(accounts){
    App.connectWallet();
  },

  connectWallet: async function(){
    const showAccount = document.querySelector('.showAccount');
    App.accounts = await App.web3Provider.request({ method: 'eth_requestAccounts' });
    showAccount.innerHTML = App.accounts[0];
    App.showAccountData(App.accounts[0]);
    App.enableCreatePlanForm();
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
      .once('transactionHash', function(hash){ console.log("transactionHash " + hash) })
      .once('receipt', function(receipt){ console.log("receipt " + receipt) })
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
      console.log("sub: ");
      console.log(sub);
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
          '<td>' + sub.startDate + '</td>' +
          '<td>' + sub.endDate + '</td>' +
          '<td>' + sub.pauseDate + '</td>' +
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
          '<td>' + plan.publisher + '</td>' +
          '<td>' + plan.fee/1e18 + '</td>' +
          '<td>' + plan.duration/24/3600 + '</td>' +
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
