import makeRequest from './makeRequest.js'
import { normalizeEntity } from './shared.js'

export default async function getBondedWithdrawal (chain: string, token: string, transferId: string) {
  const query = `
    query WithdrawalBonded($token: String, $transferId: String) {
      withdrawalBondeds(
        where: {
          transferId: $transferId,
          token: $token
        },
        orderBy: timestamp,
        orderDirection: desc,
        first: 1
      ) {
        id
        transferId
        amount

        transactionHash
        transactionIndex
        timestamp
        blockNumber
        contractAddress
        token
        from
        transaction {
          to
        }
      }
    }
  `
  const jsonRes = await makeRequest(chain, query, {
    token,
    transferId
  })

  const entity = jsonRes.withdrawalBondeds?.[0]
  return normalizeEntity(entity)
}
