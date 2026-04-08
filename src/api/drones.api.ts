import client from './client'
import type { Drone, DroneModel, DroneStatus, Paginated } from '../types'

export interface ListDronesParams {
  page?: number
  limit?: number
  status?: DroneStatus
}

export interface CreateDronePayload {
  serialNumber: string
  model: DroneModel
}

export interface UpdateDronePayload {
  model?: DroneModel
  status?: DroneStatus
}

export const dronesApi = {
  list: (params?: ListDronesParams) =>
    client.get<Paginated<Drone>>('/drones', { params }).then((r) => r.data),

  get: (id: string) =>
    client.get<Drone>(`/drones/${id}`).then((r) => r.data),

  create: (body: CreateDronePayload) =>
    client.post<Drone>('/drones', body).then((r) => r.data),

  update: (id: string, body: UpdateDronePayload) =>
    client.patch<Drone>(`/drones/${id}`, body).then((r) => r.data),

  retire: (id: string) =>
    client.delete<void>(`/drones/${id}`).then(() => undefined),
}
