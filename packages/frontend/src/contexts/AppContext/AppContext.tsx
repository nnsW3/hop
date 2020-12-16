import React, { FC, useMemo, createContext, useContext } from 'react'

import { useWeb3Context } from 'src/contexts/Web3Context'
import User from 'src/models/User'
import Token from 'src/models/Token'
import Network from 'src/models/Network'
import Transaction from 'src/models/Transaction'
import useNetworks from './useNetworks'
import useTokens from './useTokens'
import useTransactions, { Transactions } from './useTransactions'
import useContracts, { Contracts } from './useContracts'
import useEvents, { Events } from './useEvents'
import { useAccountDetails, AccountDetails } from './useAccountDetails'
import { useTxConfirm, TxConfirm } from './useTxConfirm'

type AppContextProps = {
  user: User | undefined
  networks: Network[]
  contracts: Contracts | undefined
  tokens: Token[]
  events: Events | undefined
  transactions: Transactions | undefined
  accountDetails: AccountDetails | undefined
  txConfirm: TxConfirm | undefined
}

const AppContext = createContext<AppContextProps>({
  user: undefined,
  networks: [],
  contracts: undefined,
  tokens: [],
  transactions: undefined,
  events: undefined,
  accountDetails: undefined,
  txConfirm: undefined
})

const AppContextProvider: FC = ({ children }) => {
  const { provider } = useWeb3Context()

  const user = useMemo(() => {
    if (!provider) {
      return undefined
    }

    return new User(provider)
  }, [provider])

  const networks = useNetworks()
  const contracts = useContracts(networks)
  const tokens = useTokens(networks)
  const events = useEvents()
  const transactions = useTransactions()
  const accountDetails = useAccountDetails()
  const txConfirm = useTxConfirm()

  return (
    <AppContext.Provider
      value={{
        user,
        networks,
        contracts,
        tokens,
        events,
        transactions,
        accountDetails,
        txConfirm
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

export default AppContextProvider
