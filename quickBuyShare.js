const ethers = require('ethers');
require("dotenv").config();

/*
 快速购买股份
*/


const shareAddressArg = process.argv[2];

console.log('First argument: ' + shareAddressArg);

let shareAddress = '0x7324664649265d363a0d5e3c725bee1265a45cb1';
const friendsAddress = '0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4';
const provider = new ethers.JsonRpcProvider(`https://mainnet.base.org`);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_Part1 + process.env.PRIVATE_KEY_Part2);
const gasPrice = ethers.parseUnits('0.000000000000049431', 'ether');
const getTwitterByAddressAPI = "https://prod-api.kosetto.com/users/";


// 写成一个方法，参数 address，返回推特数据


// 调用 getTwitterByAddressAPI 接口，获取用户的 twitter 账号
const getTwitterByAddress = async (address) => {
  const axios = require('axios');
  const response = await axios.get(getTwitterByAddressAPI + address, {});
  return response.data;
}

const run = async () => {
    if (shareAddressArg) {
      shareAddress = shareAddressArg;
    }
    console.log('shareAddress:', shareAddress);

    await getTwitterByAddress(shareAddress).then((data) => {
      console.log('data:', data);
    } ); 

    const baseBalance = await provider.getBalance(wallet.address);
    console.log(`Balance of ${wallet.address}: ${ethers.formatEther(baseBalance)}`);

    const account = wallet.connect(provider);
    const friends = new ethers.Contract(
      friendsAddress,
      [
        'function buyShares(address arg0, uint256 arg1)',
        'function getBuyPriceAfterFee(address sharesSubject, uint256 amount) public view returns (uint256)',
        'function sharesBalance(address sharesSubject, address holder) public view returns (uint256)',
        'function sharesSupply(address sharesSubject) public view returns (uint256)',
        'function sellShares(address sharesSubject, uint256 amount) public payable',
        'event Trade(address trader, address subject, bool isBuy, uint256 shareAmount, uint256 ethAmount, uint256 protocolEthAmount, uint256 subjectEthAmount, uint256 supply)',
      ],
      account
    );
    const buyPrice = await friends.getBuyPriceAfterFee(shareAddress, 1);
    console.log(`Buy Price of ${shareAddress}: ${ethers.formatEther(buyPrice)}`);
    const readline = require('readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(' Buy ? ', async (buy) => {
      if (buy !== 'yes' && buy !== 'y') {
        console.log('Not buying');
        rl.close();
        return false;
      }
      console.log(`Hello ${buy}!`);
      
      rl.close();

      // 如果 buyPrice 小于 baseBalance + gasPrice ，就购买
      if (buyPrice >(baseBalance + gasPrice)) {
        console.log('Insufficient funds');
        return false;
      }
      const buyTx = await friends.buyShares(shareAddress, 1, {value: buyPrice, gasPrice}); // buy 1 share
      const receipt = await buyTx.wait();
      const supplyBefore = await friends.sharesSupply(shareAddress); // get the number of shares
      console.log('supplyBefore:', supplyBefore);
      // const supplyAfter = await friends.sharesSupply(shareAddress); // get the number of shares
      // if (supply > 1) {
      //   const tx5 = await friends.sellShares(shareAddress, 1, {gasPrice});
      //   const receipt5 = await tx5.wait();
      // } else {
      //   console.log('Bag Holder, no takers')
      // }
      // const weiBalance = await provider.getBalance(wallet.address);
      // const amountOut = weiBalance - 20000000000000n;
      // const transferTX2 = await account.sendTransaction({
      //     to: wallet.address,
      //     value: amountOut,
      //     gasPrice,
      //     provider,
      // });
      // const r2 = await transferTX2.wait();
      // run();
    });

}

try {
    run();
} catch (error) {
  console.error('ERR:', error);
}

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  // try {  
  //   const account = tmpWallet.connect(provider);
  //   const weiBalance = await provider.getBalance(tmpWallet.address);
  //   const amountOut = weiBalance - 20000000000000n;
  //   const transferTX2 = await account.sendTransaction({
  //       to: wallet.address,
  //       value: amountOut,
  //       gasPrice,
  //       provider,
  //   });
  //   const r2 = await transferTX2.wait();
  // } catch (err) {
  //   console.log('Cant transfer out')
  // }
  // run();
}); // restart the bot if there is an error