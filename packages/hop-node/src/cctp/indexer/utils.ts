import { getChain } from '@hop-protocol/sdk'
import { utils } from 'ethers'
import { MAX_BLOCK_RANGE_PER_INDEX } from './constants.js'
import { IndexerEventFilter } from './OnchainEventIndexer.js'

export function getUniqueFilterId (indexerEventFilter: IndexerEventFilter): string {
  const { chainId, eventSig, eventContractAddress } = indexerEventFilter 
  const id = chainId + eventSig + eventContractAddress
  return utils.keccak256(utils.toUtf8Bytes(id))
}

export function getMaxBlockRangePerIndex (chainId: string): number {
  const chainSlug = getChain(chainId).slug
  return MAX_BLOCK_RANGE_PER_INDEX[chainSlug]
}
