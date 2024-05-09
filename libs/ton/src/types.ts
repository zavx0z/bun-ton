type persistenceType = "onchain" | "offchain_private_domain" | "offchain_ipfs"

export type JettonMetaDataKeys = "name" | "description" | "image" | "symbol" | "image_data" | "decimals"

export type JettonOnChainMetadataSpec = { [key in JettonMetaDataKeys]: "utf8" | "ascii" | undefined }

export type Content = Promise<{
  persistenceType: persistenceType
  metadata: { [s in JettonMetaDataKeys]?: string }
  isJettonDeployerFaultyOnChainData?: boolean
}>

export type NftMetadata = Promise<{
  persistenceType: persistenceType
  metadata: { [s in JettonMetaDataKeys]?: string }
  isJettonDeployerFaultyOnChainData?: boolean
}>

export type JettonMetadata = Promise<{
  persistenceType: persistenceType
  metadata: { [s in JettonMetaDataKeys]?: string }
  isJettonDeployerFaultyOnChainData?: boolean
}>

export type JettonOnchainMetadata = {
  metadata: { [s in JettonMetaDataKeys]?: string }
  isJettonDeployerFaultyOnChainData: boolean
}

export type JettonOffchainMetadata = Promise<{
  metadata: { [s in JettonMetaDataKeys]?: string }
  isIpfs: boolean
}>
