import { LocationSettings } from './LocationSettings'
import { LocationAuthorizedUser } from './LocationAuthorizedUser'

export interface Location {
  id: string
  name: string
  slugifiedName: string
  maxUsersPerInstance: number
  sceneId: string
  locationSettingsId: string
  locationSettings: LocationSettings
  isLobby: boolean
  isFeatured: boolean
  location_settings?: any
  locationAuthorizedUsers?: LocationAuthorizedUser[]
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
  locationSettings: {
    id: '',
    locationId: '',
    instanceMediaChatEnabled: false,
    audioEnabled: false,
    screenSharingEnabled: false,
    faceStreamingEnabled: false,
    locationType: 'private',
    videoEnabled: false
  },
  locationAuthorizedUsers: []
}
