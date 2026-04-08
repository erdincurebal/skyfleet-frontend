import type { MaintenanceType } from './enums'

export interface MaintenanceLog {
  id: string
  droneId: string
  type: MaintenanceType
  technicianName: string
  notes: string | null
  performedAt: string
  flightHoursAtMaintenance: number
  createdAt: string
  updatedAt: string
}
