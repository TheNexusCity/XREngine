import { Relationship } from '@xrengine/common/src/interfaces/Relationship'
import { User } from '@xrengine/common/src/interfaces/User'
import { useDispatch, store } from '../../store'
import { client } from '../../feathers'
import { createState, DevTools, useState, none, Downgraded } from '@speigg/hookstate'
import { RelationshipSeed } from '@xrengine/common/src/interfaces/Relationship'
import { ethers } from 'ethers'
import Moralis from 'moralis'
import axios from 'axios'
import { Principal } from '@dfinity/principal'
import { NFTIDL } from '../../util/nft.did'

/**
 * Moralis SDK config - ERC721
 */
const serverUrl = 'https://s0vkti4ccvl3.usemoralis.com:2053/server' // Moralis Server Url here
const appId = 'DFDqRRGNHvPpOFmVqNSEkNFtSYUkQfLpY4UOZyw7' // Moralis Server App ID here
Moralis.start({ serverUrl, appId })

//State
const state = createState({
  coinData: [] as Array<any>,
  data: [] as Array<any>,
  user: [] as Array<any>,
  type: [] as Array<any>,
  isLoading: false,
  isLoadingtransfer: false
})

store.receptors.push((action: InventoryActionType): void => {
  state.batch((s) => {
    switch (action.type) {
      case 'SET_INVENTORY_DATA':
        return s.merge({
          data: [...action.data.filter((val) => val.isCoin === false)],
          coinData: [...action.data.filter((val) => val.isCoin === true)]
        })
      case 'SET_USER_DATA':
        return s.merge({
          user: [...action.user]
        })
      case 'SET_TYPE_DATA':
        return s.merge({
          type: [...action.types]
        })
      case 'LOAD_TRANFER':
        return s.merge({ isLoadingtransfer: true })
      case 'STOP_LOAD_TRANFER':
        return s.merge({ isLoadingtransfer: false })
      case 'LOAD_INVENTORY':
        return s.merge({ isLoading: true })
      case 'STOP_LOAD_INVENTORY':
        return s.merge({ isLoading: false })
    }
  }, action.type)
})

export const accessInventoryState = () => state
export const useInventoryState = () => useState(state) as any as typeof state as unknown as typeof state

// Blockchain ERC721 NFT metadata
const apiKey = '3KR3QB1T46GYWMING2CFTN6FPZEBT7SIRV'
const corsUrl = 'https://arcane-eyrie-83731.herokuapp.com/'
const InventoryNFTService = {
  contracts: {},
  getCorsUrl: (url) => {
    return corsUrl + url
  },

  getPinataUrl: (url) => {
    if (!url) return ''
    if (url.includes('ipfs://')) url = url.replace('ipfs://', 'https://ipfs.io/ipfs/')
    if (url.includes('gateway.pinata.cloud')) url = url.replace('gateway.pinata.cloud', 'ipfs.io')
    return url
  },

  getContract: async (address) => {
    if (!InventoryNFTService.contracts[address]) {
      let response = await axios.get(
        `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`
      )
      if (response.status !== 200) return { status: 0 }
      const abi = response.data.result
      console.warn('abi: ', abi)
      const provider = new ethers.providers.EtherscanProvider('homestead', apiKey)
      const contract = new ethers.Contract(address, abi, provider)
      InventoryNFTService.contracts[address] = contract
    }
    return InventoryNFTService.contracts[address]
  },
  getTokenMetadata: async (address, tokenId) => {
    try {
      const contract = InventoryNFTService.getContract(address)
      let response = await (contract as any).functions.tokenURI(tokenId)
      if (!response.length) return { status: 0 }
      const tokenURI = response[0]
      response = await axios.get(InventoryNFTService.getCorsUrl(InventoryNFTService.getPinataUrl(tokenURI)))
      return { status: response.status, data: response.data }
    } catch {
      return { status: 0 }
    }
  }
}

//Service
export const InventoryService = {
  handleTransfer: async (ids, itemid, inventoryid) => {
    const dispatch = useDispatch()
    dispatch(InventoryAction.loadtransfer())
    try {
      const response = await client.service('user-inventory').patch({
        userId: ids,
        userInventoryId: itemid
      })
      InventoryService.fetchInventoryList(inventoryid)
    } catch (err) {
      console.error(err, 'error')
    } finally {
      dispatch(InventoryAction.stoploadtransfer())
    }
  },

  fetchInventoryList: async (id) => {
    const dispatch = useDispatch()
    dispatch(InventoryAction.loadinventory())
    try {
      const response = await client.service('user').get(id)

      let invenData: any = await client.service('inventory-item').find({ query: { isCoin: true } })
      const invenItem = invenData.data[0]

      const inventory_items: any = []

      /**
       * ERC721 NFT Sync
       */

      // A Web3Provider wraps a standard Web3 provider, which is
      // what MetaMask injects as window.ethereum into each page
      // const provider = new ethers.providers.Web3Provider((window as any).ethereum)

      // // MetaMask requires requesting permission to connect users accounts
      // await provider.send('eth_requestAccounts', [])

      // The MetaMask plugin also allows signing transactions to
      // send ether and pay to change state within the blockchain.
      // For this, you need the account signer...
      // const signer = provider.getSigner()

      // const walletAddress = await signer.getAddress()

      // const options = { chain: 'rinkeby', address: walletAddress } as any
      // const myNftData = await Moralis.Web3API.account.getNFTs(options)

      // myNftData.result?.forEach(async (item) => {
      //   if (item.metadata) {
      //     const meta = JSON.parse(item.metadata)
      //     inventory_items.push({
      //       ...invenItem,
      //       user_inventory: { quantity: 1 },
      //       slot: inventory_items.length,
      //       name: meta.name,
      //       url: meta.image
      //     })
      //   }
      // })

      /**
       * DIP721 NFT Sync
       */
      const nftCanisterId = 'vlhm2-4iaaa-aaaam-qaatq-cai'

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

      const name = await nftActor?.nameDip721()
      const symbol = await nftActor?.symbolDip721()

      // My NFTS
      const myNFTs = await nftActor?.getMetadataForUserDip721(Principal.fromText(walletAddress))

      myNFTs.forEach((item) => {
        inventory_items.push({
          ...invenItem,
          user_inventory: { quantity: 1 },
          slot: inventory_items.length,
          name: name + item.token_id,
          url: item.metadata_desc[0].key_val_data[4].val.TextContent
        })
      })

      dispatch(InventoryAction.setinventorydata(inventory_items))
    } catch (err) {
      console.error(err, 'error')
    } finally {
      dispatch(InventoryAction.stoploadinventory())
    }
  },

  fetchUserList: async (id) => {
    const dispatch = useDispatch()
    try {
      const response = await client.service('inventory-item').find({
        query: {
          isCoin: true
        }
      })
      const resp = response?.data[0]
      const prevData = [...resp?.users]
      if (response.data && response.data.length !== 0) {
        const activeUser = prevData.filter((val: any) => val.inviteCode !== null && val.id !== id)

        dispatch(InventoryAction.setuserdata(activeUser))
      }
    } catch (err) {
      console.error(err, 'error')
    }
  },

  fetchtypeList: async () => {
    const dispatch = useDispatch()

    try {
      const response = await client.service('inventory-item-type').find()
      if (response.data && response.data.length !== 0) {
        dispatch(InventoryAction.settypedata(response.data))
      }
    } catch (err) {
      console.error(err, 'error')
    }
  }
}

//Action
export const InventoryAction = {
  loadtransfer: () => {
    return {
      type: 'LOAD_TRANFER' as const
    }
  },
  stoploadtransfer: () => {
    return {
      type: 'STOP_LOAD_TRANFER' as const
    }
  },
  loadinventory: () => {
    return {
      type: 'LOAD_INVENTORY' as const
    }
  },
  stoploadinventory: () => {
    return {
      type: 'STOP_LOAD_INVENTORY' as const
    }
  },
  setinventorydata: (arr) => {
    return {
      type: 'SET_INVENTORY_DATA' as const,
      data: [...arr]
    }
  },
  setuserdata: (userarr) => {
    return {
      type: 'SET_USER_DATA' as const,
      user: [...userarr]
    }
  },
  settypedata: (typearr) => {
    return {
      type: 'SET_TYPE_DATA' as const,
      types: [...typearr]
    }
  }
}

export type InventoryActionType = ReturnType<typeof InventoryAction[keyof typeof InventoryAction]>
