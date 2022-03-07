import { Principal } from '@dfinity/principal'
import { NFTIDL } from '../../util/nft.did'

const nftCanisterId = 'vlhm2-4iaaa-aaaam-qaatq-cai'

export const getMyDIP721Tokens = () => {
  return new Promise(async (resolve, reject) => {
    const hasAllowed = await (window as any).ic?.plug?.requestConnect({
      whitelist: [nftCanisterId] // whitelisting canister ID's for plug
    })
    if (!hasAllowed) {
      console.error('allow the canisters')
    }

    const wallet = await (window as any).ic?.plug?.getPrincipal()
    const walletAddress = wallet.toText()

    const nftActor = await (window as any).ic?.plug?.createActor({
      canisterId: nftCanisterId,
      interfaceFactory: NFTIDL.factory
    })

    // const name = await nftActor?.nameDip721()
    // const symbol = await nftActor?.symbolDip721()

    // My NFTS
    const myNFTs = await nftActor?.getMetadataForUserDip721(Principal.fromText(walletAddress))

    resolve(myNFTs)
  })
}
