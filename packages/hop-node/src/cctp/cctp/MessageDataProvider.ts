import type { DecodedLogWithContext } from '../types.js'
import {
  MessageSDK,
  type HopCCTPTransferSentDecodedWithMessage,
  type HopCCTPTransferReceivedDecoded
} from './MessageSDK.js'
import { getChain } from '@hop-protocol/sdk'
import { getRpcProvider } from '#utils/getRpcProvider.js'
import { DataProvider } from '../data-provider/DataProvider.js'
import { type IMessage, MessageState, type ISentMessage, type IRelayedMessage } from './types.js'

// Since the messages are unique by chainId, his MessageDataProvider should be the
// class that abstracts this away.

// TODO: Somewhere the data returned from the indexer needs to be validated against historical
// data to ensure, for example, the message didn't change.


export class MessageDataProvider extends DataProvider<MessageState, IMessage> {

  /**
   * Implementation
   */

  protected override getKeyFromDataSourceItem (log: DecodedLogWithContext): MessageState {
    return this.#getStateFromLog(log)
  }

  protected override async formatDataSourceItem (state: MessageState, log: DecodedLogWithContext): Promise<IMessage> {
    switch (state) {
      case MessageState.Sent:
        return this.#formatTransferSentLog(log as DecodedLogWithContext<HopCCTPTransferSentDecodedWithMessage>)
      case MessageState.Relayed:
        return this.#formatRelayedLog(log as DecodedLogWithContext<HopCCTPTransferReceivedDecoded>)
      default:
        throw new Error('Invalid state')
    }
  }

  /**
   * Internal
   */

  async #formatTransferSentLog (log: DecodedLogWithContext<HopCCTPTransferSentDecodedWithMessage>): Promise<ISentMessage> {
    const { transactionHash,context, decoded } = log
    const { chainId } = context
    const { message, cctpNonce, chainId: destinationChainId } = decoded
    const timestampMs = await this.#getBlockTimestampFromLogMs(log)

    return {
      message,
      messageNonce: cctpNonce,
      sourceChainId: chainId,
      destinationChainId,
      sentTxHash: transactionHash,
      sentTimestampMs: timestampMs
    }
  }

  async #formatRelayedLog (log: DecodedLogWithContext<HopCCTPTransferReceivedDecoded>): Promise<IRelayedMessage> {
    const { transactionHash, decoded } = log
    const { messageBody, sourceDomain } = decoded
    const timestampMs = await this.#getBlockTimestampFromLogMs(log)
    return {
      message: messageBody,
      destinationChainId: sourceDomain,
      relayTransactionHash: transactionHash,
      relayTimestampMs: timestampMs
    }
  }

  /**
   * Utils
   */

  async #getBlockTimestampFromLogMs (log: DecodedLogWithContext): Promise<number> {
    const { context, blockNumber } = log
    const chainSlug = getChain(context.chainId).slug
    const provider = getRpcProvider(chainSlug)
    const block = await provider.getBlock(blockNumber)
    return block.timestamp * 1000
  }

  #getStateFromLog (log: DecodedLogWithContext): MessageState {
    const eventSig = log.topics[0]
    switch (eventSig) {
      case (MessageSDK.HOP_CCTP_TRANSFER_SENT_SIG):
       return MessageState.Sent
      case (MessageSDK.MESSAGE_RECEIVED_EVENT_SIG):
        return MessageState.Relayed
      default:
        throw new Error('Invalid log')
    }
  }
}
