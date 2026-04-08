import client from './client'
import type { MaintenanceLog, MaintenanceType, Paginated } from '../types'

export interface ListMaintenanceParams {
  page?: number
  limit?: number
  droneId?: string
}

export interface CreateMaintenanceLogPayload {
  droneId: string
  type: MaintenanceType
  technicianName: string
  notes?: string
  performedAt: string
  flightHoursAtMaintenance: number
}

export const maintenanceApi = {
  list: (params?: ListMaintenanceParams) =>
    client.get<Paginated<MaintenanceLog>>('/maintenance-logs', { params }).then((r) => r.data),

  get: (id: string) =>
    client.get<MaintenanceLog>(`/maintenance-logs/${id}`).then((r) => r.data),

  create: (body: CreateMaintenanceLogPayload) =>
    client.post<MaintenanceLog>('/maintenance-logs', body).then((r) => r.data),
}
