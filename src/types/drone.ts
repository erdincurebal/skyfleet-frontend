import type { DroneModel, DroneStatus } from './enums'

export interface Drone {
  id: string
  serialNumber: string
  model: DroneModel
  status: DroneStatus
  totalFlightHours: number
  lastMaintenanceDate: string | null
  nextMaintenanceDueDate: string | null
  createdAt: string
  updatedAt: string
}
