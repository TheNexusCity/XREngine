import { LocationSettings } from './LocationSettings'

export interface Location {
  id: string
  name: string
  slugifiedName: string
  maxUsersPerInstance: number
  sceneId: string
  locationSettingsId: string
  locationSetting: LocationSettings
  isLobby: boolean
  isFeatured: boolean
  location_settings?: LocationSettings
  location_setting?: LocationSettings
<<<<<<< HEAD
}

export interface LocationFetched {
  id: string
  name: string
  slugifiedName: string
  maxUsersPerInstance: number
  sceneId: string
  locationSettingsId: string
  locationSetting: LocationSettings
  isLobby: boolean
  isFeatured: boolean
  location_setting?: any
=======
>>>>>>> Fixed a bug with minikube client local file loading.
}

export const LocationSeed: Location = {
  id: '',
  name: '',
  slugifiedName: '',
  maxUsersPerInstance: 10,
  sceneId: '',
  locationSettingsId: '',
  isLobby: false,
  isFeatured: false,
  locationSetting: {
    id: '',
    locationId: '',
    instanceMediaChatEnabled: false,
    audioEnabled: false,
    screenSharingEnabled: false,
    faceStreamingEnabled: false,
    locationType: 'private',
    videoEnabled: false
  }
}
