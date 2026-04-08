import type { DroneStatus, DroneModel } from './enums'

export interface OverdueDrone {
  id: string
  serialNumber: string
  model: DroneModel
  status: DroneStatus
  totalFlightHours: number
  lastMaintenanceDate: string | null
  nextMaintenanceDueDate: string | null
  reason: 'HOURS' | 'DATE' | 'BOTH'
}

export interface DueSoonDrone {
  id: string
  serialNumber: string
  model: DroneModel
  status: DroneStatus
  totalFlightHours: number
  lastMaintenanceDate: string | null
  nextMaintenanceDueDate: string | null
  reason: 'HOURS' | 'DATE' | 'BOTH'
  daysUntilDue: number | null
  hoursUntilDue: number | null
}

export interface FleetHealthResponse {
  totals: {
    totalDrones: number
    byStatus: Record<DroneStatus, number>
  }
  overdueMaintenanceDrones: OverdueDrone[]
  dueSoonDrones: DueSoonDrone[]
  missionsNext24h: number
  averageFlightHoursPerDrone: number
}
