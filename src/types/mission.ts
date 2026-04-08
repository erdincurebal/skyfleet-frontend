import type { MissionStatus, MissionType } from './enums'
import type { Drone } from './drone'

export interface Mission {
  id: string
  name: string
  type: MissionType
  status: MissionStatus
  droneId: string
  drone?: Drone
  pilotName: string
  siteLocation: string
  plannedStart: string
  plannedEnd: string
  loggedFlightHours: number | null
  abortReason: string | null
  createdAt: string
  updatedAt: string
}
