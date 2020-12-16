import React, { FC, createContext, useContext, useState, useMemo } from 'react'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import Token from 'src/models/Token'
import Network from 'src/models/Network'
import Transaction from 'src/models/Transaction'
import { useApp } from 'src/contexts/AppContext'
import { useWeb3Context } from 'src/contexts/Web3Context'
import { addresses } from 'src/config'

type ConvertContextProps = {
  selectedToken: Token | undefined
  sourceNetwork: Network | undefined
  setSourceNetwork: (network: Network) => void
  sourceNetworks: Network[]
  destNetwork: Network | undefined
  setDestNetwork: (network: Network) => void
  sourceTokenAmount: string | undefined
  setSourceTokenAmount: (value: string) => void
  destTokenAmount: string | undefined
  setDestTokenAmount: (value: string) => void
  convertTokens: () => void
  validFormFields: boolean
  calcAltTokenAmount: (value: string) => Promise<string>
  sending: boolean
}

const ConvertContext = createContext<ConvertContextProps>({
  selectedToken: undefined,
  sourceNetwork: undefined,
  setSourceNetwork: (network: Network) => {},
  sourceNetworks: [],
  destNetwork: undefined,
  setDestNetwork: (network: Network) => {},
  sourceTokenAmount: undefined,
  setSourceTokenAmount: (value: string) => {},
  destTokenAmount: undefined,
  setDestTokenAmount: (value: string) => {},
  convertTokens: () => {},
  validFormFields: false,
  calcAltTokenAmount: async (value: string): Promise<string> => '',
  sending: false
})

const ConvertContextProvider: FC = ({ children }) => {
  const {
    provider,
    setRequiredNetworkId,
    connectedNetworkId
  } = useWeb3Context()
  const app = useApp()
  let { networks: nets, tokens, contracts, txConfirm } = app
  let transactions = app?.transactions?.transactions
  const arbitrumDai = contracts?.arbitrumDai
  const arbitrumUniswapRouter = contracts?.arbitrumUniswapRouter
  const arbitrumL1Messenger = contracts?.arbitrumL1Messenger
  const networks = useMemo(() => {
    const kovanNetwork = nets.find(
      (network: Network) => network.slug === 'kovan'
    ) as Network
    const arbitrumNetwork = nets.find(
      (network: Network) => network.slug === 'arbitrum'
    ) as Network
    const arbitrumCanonicalBridgeNetwork = new Network({
      name: 'Arbitrum Canonical',
      slug: arbitrumNetwork.slug,
      imageUrl: arbitrumNetwork.imageUrl,
      rpcUrl: arbitrumNetwork.rpcUrl,
      networkId: arbitrumNetwork.networkId
    })
    const arbitrumHopBridgeNetwork = new Network({
      name: 'Arbitrum Hop bridge',
      slug: 'arbitrumHopBridge',
      imageUrl: arbitrumNetwork.imageUrl,
      rpcUrl: arbitrumNetwork.rpcUrl,
      networkId: arbitrumNetwork.networkId
    })
    return [
      kovanNetwork,
      arbitrumCanonicalBridgeNetwork,
      arbitrumHopBridgeNetwork
    ]
  }, [nets])
  const [sourceNetworks] = useState<Network[]>(networks)
  tokens = tokens.filter((token: Token) => ['DAI'].includes(token.symbol))
  const [selectedToken] = useState<Token>(tokens[0])
  const [sourceNetwork, setSourceNetwork] = useState<Network | undefined>(
    sourceNetworks[0]
  )
  const [destNetwork, setDestNetwork] = useState<Network | undefined>()
  const [sourceTokenAmount, setSourceTokenAmount] = useState<string>('')
  const [destTokenAmount, setDestTokenAmount] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)

  const calcAltTokenAmount = async (value: string) => {
    if (value) {
      if (
        (sourceNetwork?.slug === 'arbitrumHopBridge' &&
          destNetwork?.slug === 'arbitrum') ||
        (sourceNetwork?.slug === 'arbitrum' &&
          destNetwork?.slug === 'arbitrumHopBridge')
      ) {
        let path = [addresses.arbitrumDai, addresses.arbitrumBridge]
        if (destNetwork?.slug === 'arbitrum') {
          path = [addresses.arbitrumBridge, addresses.arbitrumDai]
        }

        const amountsOut = await arbitrumUniswapRouter?.getAmountsOut(
          parseUnits(value, 18),
          path
        )
        value = Number(formatUnits(amountsOut[1].toString(), 18)).toFixed(2)
      }
      if (
        (sourceNetwork?.slug === 'kovan' && destNetwork?.slug === 'arbitrum') ||
        (sourceNetwork?.slug === 'arbitrum' && destNetwork?.slug === 'kovan')
      ) {
        // value is same
      }
    }

    return value
  }

  const checkWalletNetwork = () => {
    if (sourceNetwork) {
      setRequiredNetworkId(sourceNetwork?.networkId)
    }
    return connectedNetworkId === sourceNetwork?.networkId
  }

  const convertTokens = async () => {
    try {
      if (!Number(sourceTokenAmount)) {
        return
      }

      if (!checkWalletNetwork()) {
        return
      }

      setSending(true)
      const approveTokens = async (
        token: Token,
        amount: string,
        network: Network
      ): Promise<any> => {
        const signer = provider?.getSigner()
        const tokenAddress = token.addressForNetwork(network).toString()
        const contract = contracts?.getErc20Contract(tokenAddress, signer)

        const address = arbitrumUniswapRouter?.address
        const parsedAmount = parseUnits(amount, token.decimals || 18)
        const approved = await contract?.allowance(
          await signer?.getAddress(),
          address
        )

        if (approved.lt(parsedAmount)) {
          return txConfirm?.show({
            kind: 'approval',
            inputProps: {
              amount,
              token
            },
            onConfirm: async () => {
              return contract?.approve(address, parsedAmount)
            }
          })
        }
      }

      const signer = provider?.getSigner()
      const address = await signer?.getAddress()
      const value = parseUnits(sourceTokenAmount, 18)

      let tx = await approveTokens(
        selectedToken,
        sourceTokenAmount,
        sourceNetwork as Network
      )
      await tx?.wait()

      if (sourceNetwork?.slug === 'kovan') {
        if (destNetwork?.slug === 'arbitrum') {
          const tokenAddress = selectedToken
            .addressForNetwork(sourceNetwork)
            .toString()
          const arbChainAddress = '0xC34Fd04E698dB75f8381BFA7298e8Ae379bFDA71'

          tx = await txConfirm?.show({
            kind: 'convert',
            inputProps: {
              source: {
                amount: sourceTokenAmount,
                token: selectedToken
              },
              dest: {
                amount: destTokenAmount,
                token: selectedToken
              }
            },
            onConfirm: async () => {
              return arbitrumL1Messenger?.depositERC20Message(
                arbChainAddress,
                tokenAddress,
                address,
                value
              )
            }
          })
        }
      } else if (sourceNetwork?.slug === 'arbitrum') {
        if (destNetwork?.slug === 'kovan') {
          const tokenAddress = selectedToken
            .addressForNetwork(sourceNetwork)
            .toString()

          tx = await txConfirm?.show({
            kind: 'convert',
            inputProps: {
              source: {
                amount: sourceTokenAmount,
                token: selectedToken
              },
              dest: {
                amount: destTokenAmount,
                token: selectedToken
              }
            },
            onConfirm: async () => {
              return arbitrumDai?.withdraw(tokenAddress, value)
            }
          })
        }
        if (destNetwork?.slug === 'arbitrumHopBridge') {
          const amountOutMin = '0'
          const path = [addresses.arbitrumDai, addresses.arbitrumBridge]
          const deadline = (Date.now() / 1000 + 300) | 0

          tx = await txConfirm?.show({
            kind: 'convert',
            inputProps: {
              source: {
                amount: sourceTokenAmount,
                token: selectedToken
              },
              dest: {
                amount: destTokenAmount,
                token: selectedToken
              }
            },
            onConfirm: async () => {
              return arbitrumUniswapRouter?.swapExactTokensForTokens(
                value,
                amountOutMin,
                path,
                address,
                deadline
              )
            }
          })
        }
      } else if (sourceNetwork?.slug === 'arbitrumHopBridge') {
        if (destNetwork?.slug === 'arbitrum') {
          const amountOutMin = '0'
          const path = [addresses.arbitrumBridge, addresses.arbitrumDai]
          const deadline = (Date.now() / 1000 + 300) | 0

          tx = await txConfirm?.show({
            kind: 'convert',
            inputProps: {
              source: {
                amount: sourceTokenAmount,
                token: selectedToken
              },
              dest: {
                amount: destTokenAmount,
                token: selectedToken
              }
            },
            onConfirm: async () => {
              return arbitrumUniswapRouter?.swapExactTokensForTokens(
                value,
                amountOutMin,
                path,
                address,
                deadline
              )
            }
          })
        }
      }

      if (tx?.hash && sourceNetwork?.name && transactions) {
        app?.transactions?.setTransactions([
          ...transactions,
          new Transaction({ hash: tx?.hash, networkName: sourceNetwork?.slug })
        ])
      }
    } catch (err) {
      console.error(err)
    }

    setSending(false)
  }

  const validFormFields = !!(sourceTokenAmount && destTokenAmount)

  return (
    <ConvertContext.Provider
      value={{
        selectedToken,
        sourceNetwork,
        setSourceNetwork,
        sourceNetworks,
        destNetwork,
        setDestNetwork,
        sourceTokenAmount,
        setSourceTokenAmount,
        destTokenAmount,
        setDestTokenAmount,
        convertTokens,
        validFormFields,
        calcAltTokenAmount,
        sending
      }}
    >
      {children}
    </ConvertContext.Provider>
  )
}

export const useConvert = () => useContext(ConvertContext)

export default ConvertContextProvider
