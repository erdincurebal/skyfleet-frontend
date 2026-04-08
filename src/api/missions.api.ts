import client from './client'
import type { Mission, MissionStatus, MissionType, Paginated } from '../types'

export interface ListMissionsParams {
  page?: number
  limit?: number
  status?: MissionStatus
  droneId?: string
  from?: string
  to?: string
}

export interface CreateMissionPayload {
  name: string
  type: MissionType
  droneId: string
  pilotName: string
  siteLocation: string
  plannedStart: string
  plannedEnd: string
}

export interface TransitionMissionPayload {
  targetStatus: MissionStatus
  loggedFlightHours?: number
  abortReason?: string
}

export const missionsApi = {
  list: (params?: ListMissionsParams) =>
    client.get<Paginated<Mission>>('/missions', { params }).then((r) => r.data),

  get: (id: string) =>
    client.get<Mission>(`/missions/${id}`).then((r) => r.data),

  create: (body: CreateMissionPayload) =>
    client.post<Mission>('/missions', body).then((r) => r.data),

  transition: (id: string, body: TransitionMissionPayload) =>
    client.post<Mission>(`/missions/${id}/transition`, body).then((r) => r.data),
}
