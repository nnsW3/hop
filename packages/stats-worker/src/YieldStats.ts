import { BigNumber, FixedNumber, constants } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import {
  ethereumRpc,
  gnosisRpc,
  polygonRpc,
  optimismRpc,
  arbitrumRpc
} from './config'
import { Hop } from '@hop-protocol/sdk'
import { mainnet as mainnetAddresses } from '@hop-protocol/core/addresses'
import {
  ERC20__factory,
  StakingRewards__factory
} from '@hop-protocol/core/contracts'

const TOTAL_AMOUNTS_DECIMALS = 18
const oneYearDays = 365

const stakingRewardsContracts: any = {
  arbitrum: {
    ETH: [
      '0x755569159598f3702bdD7DFF6233A317C156d3Dd',
    ],
    USDC: [
      '0xb0CabFE930642AD3E7DECdc741884d8C3F7EbC70',
    ],
    DAI: [
      '0xd4D28588ac1D9EF272aa29d4424e3E2A03789D1E',
    ],
    USDT: [
      '0x9Dd8685463285aD5a94D2c128bda3c5e8a6173c8',
    ],
  },
  optimism: {
    ETH: [
      '0x95d6A95BECfd98a7032Ed0c7d950ff6e0Fa8d697',
    ],
    USDC: [
      '0xf587B9309c603feEdf0445aF4D3B21300989e93a',
    ],
    DAI: [
      '0x392B9780cFD362bD6951edFA9eBc31e68748b190',
    ],
    USDT: [
      '0xAeB1b49921E0D2D96FcDBe0D486190B2907B3e0B',
    ],
    SNX: [
      '0x25a5A48C35e75BD2EFf53D94f0BB60d5A00E36ea',
      '0x09992Dd7B32f7b35D347DE9Bdaf1919a57d38E82',
    ],
  },
  polygon: {
    ETH: [
      '0x7bCeDA1Db99D64F25eFA279BB11CE48E15Fda427',
      '0xAA7b3a4A084e6461D486E53a03CF45004F0963b7',
    ],
    USDC: [
      '0x2C2Ab81Cf235e86374468b387e241DF22459A265',
      '0x7811737716942967Ae6567B26a5051cC72af550E',
    ],
    DAI: [
      '0x4Aeb0B5B1F3e74314A7Fa934dB090af603E8289b',
      '0xd6dC6F69f81537Fe9DEcc18152b7005B45Dc2eE7',
    ],
    USDT: [
      '0x07932e9A5AB8800922B2688FB1FA0DAAd8341772',
      '0x297E5079DF8173Ae1696899d3eACD708f0aF82Ce',
    ],
    MATIC: [
      '0x7dEEbCaD1416110022F444B03aEb1D20eB4Ea53f',
    ],
  },
  gnosis: {
    ETH: [
      '0xC61bA16e864eFbd06a9fe30Aab39D18B8F63710a',
      '0x712F0cf37Bdb8299D0666727F73a5cAbA7c1c24c',
    ],
    USDC: [
      '0x5D13179c5fa40b87D53Ff67ca26245D3D5B2F872',
      '0x636A7ee78faCd079DaBC8f81EDA1D09AA9D440A7',
    ],
    DAI: [
      '0x12a3a66720dD925fa93f7C895bC20Ca9560AdFe7',
      '0xBF7a02d963b23D84313F07a04ad663409CEE5A92',
    ],
    USDT: [
      '0x2C2Ab81Cf235e86374468b387e241DF22459A265',
      '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1',
    ],
  }
}

const rewardTokenAddresses: any = {
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  GNO: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb'
}

type YieldDataRes = {
  apr: number
  apy: number
}

type StakingYieldDataRes = {
  apr: number
  apy: number
  rewardToken: string
  stakingRewardsContractAddress: string
  isOptimal: boolean
}

type PoolData = {
  apr: number
  apy: number
}

type StakingRewardsData = {
  apr: number
  apy: number
  rewardToken: string
}

type OptimalYieldData = {
  apr: number
  apy: number
  rewardToken: string
}

type Pools = {
  [token: string]: {
    [chain: string]: PoolData
  }
}

type StakingRewards = {
  [token: string]: {
    [chain: string]: {
      [rewardContractAddress: string]: StakingRewardsData
    }
  }
}

type OptimalYield = {
  [token: string]: {
    [chain: string]: OptimalYieldData
  }
}

type YieldData = {
  pools: Pools,
  stakingRewards: StakingRewards,
  optimalYield: OptimalYield
}

type Response = {
  timestamp: number
  yieldData: YieldData
}

class YieldStats {
  sdk = new Hop('mainnet')

  constructor () {
    this.sdk.setChainProviderUrls({
      ethereum: ethereumRpc,
      gnosis: gnosisRpc,
      polygon: polygonRpc,
      optimism: optimismRpc,
      arbitrum: arbitrumRpc
    })

    console.log(
      'provider urls:',
      JSON.stringify(this.sdk.getChainProviderUrls())
    )
  }

  async getAllYields () {
    const timestamp = (Date.now() / 1000) | 0
    const bridges: any = mainnetAddresses.bridges
    let yieldData: YieldData = this.initializeYieldData(bridges)
    const promises: Promise<any>[] = []
    for (let token in bridges) {
      for (let chain in bridges[token]) {
        if (chain === 'ethereum') {
          continue
        }
        if (!bridges[token][chain]) {
          continue
        }
        if (bridges[token][chain].l2CanonicalToken === constants.AddressZero) {
          continue
        }

        promises.push(
          this.getYieldData(token, chain)
            .then(res => {
              console.log(`${chain}.${token} got yield data`)
              yieldData.pools[token][chain] = {
                apr: res.apr,
                apy: res.apy
              }
            })
            .catch(err => console.error(err))
        )
        promises.push(
          this.getStakingYieldData(token, chain)
            .then(res => {
              console.log(`${chain}.${token} got staking yield data`)
              for (const stakingYieldData of res) {
                yieldData.stakingRewards[token][chain][stakingYieldData.stakingRewardsContractAddress] = {
                  apr: stakingYieldData.apr,
                  apy: stakingYieldData.apy,
                  rewardToken: stakingYieldData.rewardToken
                }
                if (stakingYieldData.isOptimal) {
                  yieldData.optimalYield[token][chain] = {
                    apr: stakingYieldData.apr,
                    apy: stakingYieldData.apy,
                    rewardToken: stakingYieldData.rewardToken
                  }
                }
              }
            })
            .catch(err => console.error(err))
        )
      }
    }

    await Promise.all(promises)

    // Add the pool yield to the staking yield to produce the optimal yield
    for (const token in yieldData.optimalYield) {
      const tokenData = yieldData.optimalYield[token]
      for (const chain in tokenData) {
        const chainData = tokenData[chain]
        if (chainData?.apr > 0) {
          yieldData.optimalYield[token][chain].apr += yieldData.pools[token][chain].apr
          yieldData.optimalYield[token][chain].apy += yieldData.pools[token][chain].apy
        }
      }
    }

    console.log('yield data stats:')
    console.log(JSON.stringify(yieldData, null, 2))
    const response: Response = {
      timestamp,
      yieldData
    }

    return response
  }

  initializeYieldData (bridges: any): YieldData {
    const yieldData: any = {}
    for (let token in bridges) {
      for (let chain in bridges[token]) {
        if (chain === 'ethereum') {
          continue
        }
        if (!bridges[token][chain]) {
          continue
        }
        if (bridges[token][chain].l2CanonicalToken === constants.AddressZero) {
          continue
        }

        if (!yieldData.pools) yieldData.pools = {}
        if (!yieldData.pools[token]) yieldData.pools[token] = {}
        if (!yieldData.pools[token][chain]) {
          yieldData.pools[token][chain] = {
            apr: 0,
            apy: 0
          }
        }

        const stakingContracts = stakingRewardsContracts[chain][token]
        if (stakingContracts?.length > 0) {
          if(!yieldData.stakingRewards) yieldData.stakingRewards = {}
          if(!yieldData.stakingRewards[token]) yieldData.stakingRewards[token] = {}
          if(!yieldData.stakingRewards[token][chain]) yieldData.stakingRewards[token][chain] = {}
          for (const stakingContract of stakingContracts) {
            yieldData.stakingRewards[token][chain][stakingContract] = {
              apr: 0,
              apy: 0,
              rewardToken: ''
            }
          }
        }

        if(!yieldData.optimalYield) yieldData.optimalYield = {}
        if(!yieldData.optimalYield[token]) yieldData.optimalYield[token] = {}
        if(!yieldData.optimalYield[token][chain]) {
          yieldData.optimalYield[token][chain] = {
            apr: 0,
            apy: 0,
            rewardToken: ''
          }
        }
      }
    }

    return yieldData
  }


  async getYieldData (token: string, chain: string): Promise<YieldDataRes> {
    const bridge = this.sdk.bridge(token)
    const amm = bridge.getAmm(chain)
    const { apr, apy } = await amm.getYields()
    return {
      apr: apr ?? 0,
      apy: apy ?? 0
    }
  }

  async getStakingYieldData (token: string, chain: string): Promise<StakingYieldDataRes[]> {
    const bridge = this.sdk.bridge(token)
    const canonToken = bridge.getCanonicalToken(chain)
    const amm = bridge.getAmm(chain)

    const provider = this.sdk.getChainProvider(chain)
    const stakingRewardsAddresses = stakingRewardsContracts?.[chain]?.[token]
    if (!stakingRewardsAddresses?.length) {
      return []
    }

    let currentOptimalApr = 0
    const stakingYieldData: StakingYieldDataRes[] = []
    for (const stakingRewardsAddress of stakingRewardsAddresses) {
      const assetBridge = this.sdk.bridge(token)
      const stakingRewards = StakingRewards__factory.connect(
        stakingRewardsAddress,
        provider
      )
      const stakingToken = assetBridge.getSaddleLpToken(chain)

      const totalStaked = await stakingToken.balanceOf(stakingRewards?.address)
      if (totalStaked.lte(0)) {
        continue
      }

      const stakedTotal = await amm.calculateTotalAmountForLpToken(totalStaked)
      if (stakedTotal.lte(0)) {
        continue
      }

      const tokenUsdPrice = await bridge.priceFeed.getPriceByTokenSymbol(token)

      const rewardsTokenAddress = await stakingRewards.rewardsToken()
      const rewardsToken = ERC20__factory.connect(
        rewardsTokenAddress,
        provider
      )
      const rewardsTokenSymbol = await rewardsToken.symbol()
      const rewardTokenUsdPrice = await bridge?.priceFeed.getPriceByTokenSymbol(
        rewardsTokenSymbol
      )

      const timestamp = await stakingRewards.periodFinish()
      const rewardsExpired = await this.isRewardsExpired(timestamp)

      let totalRewardsPerDay = BigNumber.from(0)
      if (!rewardsExpired) {
        const rewardRate = await stakingRewards.rewardRate()
        totalRewardsPerDay = rewardRate.mul(86400) // multiply by 1 day
      }

      const { apr, apy } = this.calculateStakingYield(
        canonToken.decimals,
        tokenUsdPrice,
        rewardTokenUsdPrice,
        stakedTotal,
        totalRewardsPerDay
      )

      // Sanity check
      if (
        (apr <= 0 && apy > 0) ||
        (apy <= 0 && apr > 0)
      ) {
        throw new Error('Cannot have negative APR and positive APY or vice versa')
      }

      // If the rewards have expired, do not log a token symbol
      let rewardToken = ''
      let stakingRewardsContractAddress = ''
      const isActiveRewards = apr > 0 && apy > 0
      if (isActiveRewards) {
        rewardToken = rewardsTokenSymbol
        stakingRewardsContractAddress = stakingRewardsAddress
      }


      stakingYieldData.push({
        apr,
        apy,
        rewardToken,
        stakingRewardsContractAddress,
        isOptimal: apr > currentOptimalApr
      })

      currentOptimalApr = apr > currentOptimalApr ? apr : currentOptimalApr
    }
    
    return stakingYieldData
  }

  async isRewardsExpired (timestamp: BigNumber) {
    const expirationDate = Number(timestamp.toString())
    const now = (Date.now() / 1000) | 0
    return now > expirationDate
  }

  // ((REWARD-TOKEN_PER_DAY * REWARD-TOKEN_PRICE)/((STAKED_USDC + STAKED_HUSDC)*STAKED_TOKEN_PRICE)) * DAYS_PER_YEAR
  calculateStakingYield (
    tokenDecimals: number,
    tokenUsdPrice: number,
    rewardTokenUsdPrice: number,
    stakedTotal: BigNumber,
    totalRewardsPerDay: BigNumber
  ) {
    const rewardTokenUsdPriceBn = this.amountToBN(
      rewardTokenUsdPrice.toString(),
      TOTAL_AMOUNTS_DECIMALS
    )
    const tokenUsdPriceBn = this.amountToBN(
      tokenUsdPrice.toString(),
      TOTAL_AMOUNTS_DECIMALS
    )
    const stakedTotal18d = this.shiftBNDecimals(
      stakedTotal,
      TOTAL_AMOUNTS_DECIMALS - tokenDecimals
    )
    const precision = this.amountToBN('1', TOTAL_AMOUNTS_DECIMALS)
    const rateBn = totalRewardsPerDay
      .mul(rewardTokenUsdPriceBn)
      .mul(precision)
      .div(stakedTotal18d.mul(tokenUsdPriceBn))


    const rate = Number(formatUnits(rateBn.toString(), TOTAL_AMOUNTS_DECIMALS))
    const apr = rate * oneYearDays
    const apy = (1 + rate) ** (oneYearDays) - 1

    return {
      apr,
      apy
    }
  }

  shiftBNDecimals (bn: BigNumber, shiftAmount: number): BigNumber {
    if (shiftAmount < 0) throw new Error('shiftAmount must be positive')
    return bn.mul(BigNumber.from(10).pow(shiftAmount))
  }

  amountToBN (amount: string | number, decimals: number = 18) {
    const fixedAmount = this.fixedDecimals(amount.toString(), decimals)
    return parseUnits(fixedAmount || '0', decimals)
  }

  fixedDecimals (amount: string, decimals: number = 18) {
    if (amount === '') {
      return amount
    }
    const mdAmount = this.maxDecimals(amount, decimals)
    return FixedNumber.from(mdAmount).toString()
  }

  maxDecimals (amount: string, decimals: number) {
    const sanitizedAmount = this.sanitizeNumericalString(amount)
    const indexOfDecimal = sanitizedAmount.indexOf('.')
    if (indexOfDecimal === -1) {
      return sanitizedAmount
    }

    const wholeAmountStr = sanitizedAmount.slice(0, indexOfDecimal) || '0'
    const wholeAmount = BigNumber.from(wholeAmountStr).toString()

    const fractionalAmount = sanitizedAmount.slice(indexOfDecimal + 1)
    const decimalAmount =
      decimals !== 0 ? `.${fractionalAmount.slice(0, decimals)}` : ''

    return `${wholeAmount}${decimalAmount}`
  }

  sanitizeNumericalString (numStr: string) {
    return numStr.replace(/[^0-9.]|\.(?=.*\.)/g, '')
  }
}

export default YieldStats
