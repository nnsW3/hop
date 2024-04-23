import { CanonicalToken, ChainId, ChainName, ChainSlug, NetworkSlug, Slug, WrappedToken } from '#networks/index.js'

export { NetworkSlug, ChainId, ChainName, ChainSlug, Slug, CanonicalToken, WrappedToken }

export type TokenSymbol = CanonicalToken | WrappedToken | string

export enum Errors {
  NotEnoughAllowance = 'Not enough allowance. Please call `approve` on the token contract to allow contract to move tokens and make sure you are connected to the correct network.',
  xDaiRebrand = 'NOTICE: xDai has been rebranded to Gnosis. Chain "xdai" is deprecated. Use "gnosis" instead.'
}
