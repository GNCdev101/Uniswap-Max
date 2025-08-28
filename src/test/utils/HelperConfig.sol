// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "../Positions.sol"; import "../Market.sol"; import "../LiquidityPoolFactory.sol"; import "../LiquidityPool.sol"; import "../PriceFeedL1.sol"; import "@solmate/tokens/ERC20.sol"; import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "@uniswapCore/contracts/UniswapV3Pool.sol"; import {SwapRouter} from "@uniswapPeriphery/contracts/SwapRouter.sol";

import "forge-std/Test.sol"; import "../test/utils/HelperConfig.sol"; import "../test/mocks/MockV3Aggregator.sol"; import {Utils} from "../test/utils/Utils.sol";

contract Deployments is Test, HelperConfig, Utils { UniswapV3Helper public uniswapV3Helper; LiquidityPoolFactory public liquidityPoolFactory; PriceFeedL1 public priceFeedL1; Market public market; Positions public positions; MockV3Aggregator public mockV3AggregatorWBTCETH; MockV3Aggregator public mockV3AggregatorUSDCETH; MockV3Aggregator public mockV3AggregatorETHUSD; LiquidityPool public lbPoolWBTC; LiquidityPool public lbPoolWETH; LiquidityPool public lbPoolUSDC; SwapRouter public swapRouter; address public alice; address public bob; address public carol; address public deployer;

HelperConfig.NetworkConfig public conf;

function setUp() public {}

function run() public {
    conf = getActiveNetworkConfig();

    address ethUsdPriceFeed;
    address btcEthPriceFeed;
    address usdcEthPriceFeed;
    address daiEthPriceFeed;

    if (block.chainid == 31337) { // Anvil
        mockV3AggregatorWBTCETH = new MockV3Aggregator(18, 14 ether); // 1 WBTC = 14 ETH
        mockV3AggregatorUSDCETH = new MockV3Aggregator(18, 1e15); // 1 USDC = 0,0001 ETH
        mockV3AggregatorETHUSD = new MockV3Aggregator(8, 1000e8); // 1 ETH = 1000 USD
        // For local testing, we don't have a DAI mock, so we can reuse another one or deploy a new one if needed.
        // For simplicity, we will not add the DAI pool in local testing for now.
        ethUsdPriceFeed = address(mockV3AggregatorETHUSD);
        btcEthPriceFeed = address(mockV3AggregatorWBTCETH);
        usdcEthPriceFeed = address(mockV3AggregatorUSDCETH);
    } else {
        ethUsdPriceFeed = conf.priceFeedETHUSD;
        btcEthPriceFeed = conf.priceFeedBTCETH;
        usdcEthPriceFeed = conf.priceFeedUSDCETH;
        daiEthPriceFeed = conf.priceFeedDAIETH;
    }

    vm.startBroadcast();

    // mainnet context
    swapRouter = SwapRouter(payable(conf.swapRouter));

    // contracts
    uniswapV3Helper = new UniswapV3Helper(conf.nonfungiblePositionManager, conf.swapRouter);
    priceFeedL1 = new PriceFeedL1(ethUsdPriceFeed, conf.addWETH);
    liquidityPoolFactory = new LiquidityPoolFactory();
    positions = new Positions(
        address(priceFeedL1),
        address(liquidityPoolFactory),
        conf.liquidityPoolFactoryUniswapV3,
        conf.nonfungiblePositionManager,
        address(uniswapV3Helper),
        conf.liquidationReward
    );
    market = new Market(
        address(positions),
        address(liquidityPoolFactory),
        address(priceFeedL1),
        msg.sender
    );

    /// configurations
    // add position addres to the factory
    liquidityPoolFactory.addPositionsAddress(address(positions));

    // transfer ownership
    positions.transferOwnership(address(market));
    liquidityPoolFactory.transferOwnership(address(market));
    priceFeedL1.transferOwnership(address(market));

    // create liquidity pools
    lbPoolWBTC = LiquidityPool(market.createLiquidityPool(conf.addWBTC));
    lbPoolWETH = LiquidityPool(market.createLiquidityPool(conf.addWETH));
    lbPoolUSDC = LiquidityPool(market.createLiquidityPool(conf.addUSDC));

    // add price feeds
    market.addPriceFeed(conf.addWBTC, btcEthPriceFeed);
    market.addPriceFeed(conf.addUSDC, usdcEthPriceFeed);
    market.addPriceFeed(conf.addWETH, ethUsdPriceFeed);

    if (block.chainid != 31337) {
         market.createLiquidityPool(conf.addDAI);
         market.addPriceFeed(conf.addDAI, daiEthPriceFeed);
    }

    vm.stopBroadcast();
}

}
