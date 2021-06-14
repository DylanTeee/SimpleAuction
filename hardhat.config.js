require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async() => {
    const accounts = await ethers.getSigners();
    for (const account of accounts) {
        console.log(account.address);
    }
});

task("balance", "Prints an account's balance")
    .addParam("account", "The account's address")
    .setAction(async taskArgs => {
        const account = web3.utils.toChecksumAddress(taskArgs.account);
        const balance = await web3.eth.getBalance(account);

        console.log(web3.utils.fromWei(balance, "ether"), "ETH");
    });


/**
 * @type import('hardhat/config').HardhatUserConfig
 */


const defaultNetwork = "localhost";

function mnemonic() {
    try {
        return fs.readFileSync("./mnemonic.txt").toString().trim();
    } catch (e) {
        if (defaultNetwork !== "localhost") {
            console.log("☢️ WARNING: No mnemonic file created for a deploy account. Try `yarn run generate` and then `yarn run account`.")
        }
    }
    return "";
}

module.exports = {
    defaultNetwork,

    // don't forget to set your provider like:
    // REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
    // (then your frontend will talk to your contracts on the live network!)
    // (you will need to restart the `yarn run start` dev server after editing the .env)

    networks: {
        localhost: {
            url: "http://localhost:8545",
            //gasPrice: 125000000000,//you can adjust gasPrice locally to see how much it will cost on production 
            /*
              notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
              (you can put in a mnemonic here to set the deployer locally)
            */
        },
        // rinkeby: {
        //     url: "https://rinkeby.infura.io/v3/460f40a260564ac4a4f4b3fffb032dad", //<---- YOUR INFURA ID! (or it won't work)
        //     accounts: {
        //         mnemonic: mnemonic(),
        //     },
        // },
        // kovan: {
        //     url: "https://kovan.infura.io/v3/460f40a260564ac4a4f4b3fffb032dad", //<---- YOUR INFURA ID! (or it won't work)
        //     accounts: {
        //         mnemonic: mnemonic(),
        //     },
        // },
        // mainnet: {
        //     url: "https://mainnet.infura.io/v3/460f40a260564ac4a4f4b3fffb032dad", //<---- YOUR INFURA ID! (or it won't work)
        //     accounts: {
        //         mnemonic: mnemonic(),
        //     },
        // },
        // ropsten: {
        //     url: "https://ropsten.infura.io/v3/460f40a260564ac4a4f4b3fffb032dad", //<---- YOUR INFURA ID! (or it won't work)
        //     accounts: {
        //         mnemonic: mnemonic(),
        //     },
        // },
        // goerli: {
        //     url: "https://goerli.infura.io/v3/460f40a260564ac4a4f4b3fffb032dad", //<---- YOUR INFURA ID! (or it won't work)
        //     accounts: {
        //         mnemonic: mnemonic(),
        //     },
        // },
        // xdai: {
        //     url: 'https://rpc.xdaichain.com/',
        //     gasPrice: 1000000000,
        //     accounts: {
        //         mnemonic: mnemonic(),
        //     },
        // },
        // matic: {
        //     url: 'https://rpc-mainnet.maticvigil.com/',
        //     gasPrice: 1000000000,
        //     accounts: {
        //         mnemonic: mnemonic(),
        //     },
        // },
    },
    solidity: {
        compilers: [{
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
            {
                version: "0.8.4",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ],

    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: "PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8"
    }
};