import { providers, Signer, Contract, BigNumber } from 'ethers'
import { Chain, Token as TokenModel } from './models'
import { MaxUint256 } from './constants'
import { addresses, chains } from './config'
import { erc20Abi } from '@hop-protocol/abi'
import { TChain, TAmount } from './types'

/**
 * Class reprensenting ERC20 Token
 * @namespace Token
 */
class Token extends TokenModel {
  /** Ethers signer or provider */
  public signer: Signer | providers.Provider

  /** Network name */
  network: string

  // TODO: clean up and remove unused parameters.
  /**
   * @desc Instantiates Token class.
   * @param {String} network - L1 network name (e.g. 'mainnet', 'kovan', 'goerli')
   * @param {Number} chainId - Chain ID.
   * @param {String} address - Token address.
   * @param {Number} decimals - Token decimals.
   * @param {String} symbol - Token symbol.
   * @param {String} name - Token name.
   * @param {Object} signer - Ethers signer.
   * @returns {Object} Token class instance.
   */
  constructor (
    network: string,
    chainId: number | string,
    address: string,
    decimals: number,
    symbol: string,
    name: string,
    signer?: Signer | providers.Provider
  ) {
    super(chainId, address, decimals, symbol, name)
    this.network = network
    if (signer) {
      this.signer = signer
    }
  }

  /**
   * @desc Returns a token instance with signer connected. Used for adding or changing signer.
   * @param {Object} signer - Ethers `Signer` for signing transactions.
   * @returns {Object} New Token SDK instance with connected signer.
   */
  public connect (signer: Signer | providers.Provider) {
    return new Token(
      this.network,
      this.chainId,
      this.address,
      this.decimals,
      this.symbol,
      this.name,
      signer
    )
  }

  /**
   * @desc Returns token allowance.
   * @param {Object} chain - Chain model.
   * @param {String} spender - spender address.
   * @returns {Object} Ethers Transaction object.
   * @example
   *```js
   *import { Hop, Chain, Token } from '@hop-protocol/sdk'
   *
   *const bridge = hop.bridge(Token.USDC).connect(signer)
   *const spender = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
   *const allowance = bridge.allowance(Chain.xDai, spender)
   *```
   */
  public async allowance (chain: TChain, spender: string) {
    chain = this.toChainModel(chain)
    const tokenContract = await this.getErc20(chain)
    const address = await this.getSignerAddress()
    if (!address) {
      throw new Error('signer required')
    }
    return tokenContract.allowance(address, spender)
  }

  /**
   * @desc Returns token balance of signer.
   * @param {Object} chain - Chain model.
   * @param {String} spender - spender address.
   * @returns {Object} Ethers Transaction object.
   * @example
   *```js
   *import { Hop, Chain, Token } from '@hop-protocol/sdk'
   *
   *const bridge = hop.bridge(Token.USDC).connect(signer)
   *const spender = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
   *const allowance = bridge.allowance(Chain.xDai, spender)
   *```
   */
  public async balanceOf (chain: TChain) {
    chain = this.toChainModel(chain)
    const tokenContract = await this.getErc20(chain)
    const address = await this.getSignerAddress()
    return tokenContract.balanceOf(address)
  }

  /**
   * @desc ERC20 token transfer
   * @param {Object} chain - Chain model.
   * @param {String} recipient - recipient address.
   * @param {String} amount - Token amount.
   * @returns {Object} Ethers Transaction object.
   * @example
   *```js
   *import { Hop, Chain, Token } from '@hop-protocol/sdk'
   *
   *const bridge = hop.bridge(Token.USDC).connect(signer)
   *const recipient = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
   *const amount = '1000000000000000000'
   *const tx = await bridge.erc20Transfer(Chain.Ethereum, spender, amount)
   *```
   */
  public async transfer (chain: TChain, recipient: string, amount: TAmount) {
    chain = this.toChainModel(chain)
    const tokenContract = await this.getErc20(chain)
    return tokenContract.transfer(recipient, amount, this.txOverrides(chain))
  }

  /**
   * @desc Approve address to spend tokens if not enough allowance .
   * @param {Object} chain - Chain model.
   * @param {String} spender - spender address.
   * @param {String} amount - amount allowed to spend.
   * @returns {Object} Ethers Transaction object.
   * @example
   *```js
   *import { Hop, Chain, Token } from '@hop-protocol/sdk'
   *
   *const bridge = hop.bridge(Token.USDC).connect(signer)
   *const spender = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
   *const amount = '1000000000000000000'
   *const tx = await bridge.approve(Chain.xDai, spender, amount)
   *```
   */
  public async approve (
    chain: TChain,
    spender: string,
    amount: TAmount = MaxUint256
  ) {
    chain = this.toChainModel(chain)
    const tokenContract = await this.getErc20(chain)
    const allowance = await this.allowance(chain, spender)
    if (allowance.lt(BigNumber.from(amount))) {
      return tokenContract.approve(spender, amount, this.txOverrides(chain))
    }
  }

  /**
   * @desc Returns a token Ethers contract instance.
   * @param {Object} chain - Chain model.
   * @returns {Object} Ethers contract instance.
   */
  public async getErc20 (chain: TChain) {
    chain = this.toChainModel(chain)
    const tokenSymbol = this.symbol
    let tokenAddress: string
    if (chain.isL1) {
      tokenAddress =
        addresses[this.network][tokenSymbol][chain.slug].l1CanonicalToken
    } else {
      tokenAddress =
        addresses[this.network][tokenSymbol][chain.slug].l2CanonicalToken
    }

    const provider = await this.getSignerOrProvider(chain)
    return new Contract(tokenAddress, erc20Abi, provider)
  }

  /**
   * @desc Returns the connected signer address.
   * @returns {String} Ethers signer address.
   * @example
   *```js
   *import { Hop } from '@hop-protocol/sdk'
   *
   *const hop = new Hop()
   *const address = await hop.getSignerAddress()
   *console.log(address)
   *```
   */
  public async getSignerAddress () {
    if (!this.signer) {
      throw new Error('signer not connected')
    }
    return (this.signer as Signer)?.getAddress()
  }

  private async getSignerOrProvider (
    chain: TChain,
    signer: Signer = this.signer as Signer
  ) {
    chain = this.toChainModel(chain)
    if (!signer) {
      return chain.provider
    }
    const connectedChainId = await signer.getChainId()
    if (connectedChainId !== chain.chainId) {
      return chain.provider
    }
    return this.signer
  }

  private toChainModel (chain: TChain) {
    if (typeof chain === 'string') {
      return Chain.fromSlug(chain)
    }

    chain.provider = this.getChainProvider(chain)
    chain.chainId = this.getChainId(chain)
    return chain
  }

  private getChainId (chain: Chain) {
    const { chainId } = chains[this.network][chain.slug]
    return Number(chainId)
  }

  private getChainProvider (chain: Chain) {
    const { rpcUrl } = chains[this.network][chain.slug]
    return new providers.StaticJsonRpcProvider(rpcUrl)
  }

  private txOverrides (chain: Chain) {
    const txOptions: any = {}
    if (chain.equals(Chain.Optimism)) {
      txOptions.gasPrice = 0
      txOptions.gasLimit = 8000000
    }
    return txOptions
  }
}

export default Token
