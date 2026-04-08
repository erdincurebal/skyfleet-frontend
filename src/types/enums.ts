export const DroneStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_MISSION: 'IN_MISSION',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED',
} as const
export type DroneStatus = (typeof DroneStatus)[keyof typeof DroneStatus]

export const DroneModel = {
  PHANTOM_4: 'PHANTOM_4',
  MATRICE_300: 'MATRICE_300',
  MAVIC_3_ENTERPRISE: 'MAVIC_3_ENTERPRISE',
} as const
export type DroneModel = (typeof DroneModel)[keyof typeof DroneModel]

export const MissionStatus = {
  PLANNED: 'PLANNED',
  PRE_FLIGHT_CHECK: 'PRE_FLIGHT_CHECK',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED',
} as const
export type MissionStatus = (typeof MissionStatus)[keyof typeof MissionStatus]

export const MissionType = {
  WIND_TURBINE_INSPECTION: 'WIND_TURBINE_INSPECTION',
  SOLAR_PANEL_SURVEY: 'SOLAR_PANEL_SURVEY',
  POWER_LINE_PATROL: 'POWER_LINE_PATROL',
} as const
export type MissionType = (typeof MissionType)[keyof typeof MissionType]

export const MaintenanceType = {
  ROUTINE_CHECK: 'ROUTINE_CHECK',
  BATTERY_REPLACEMENT: 'BATTERY_REPLACEMENT',
  MOTOR_REPAIR: 'MOTOR_REPAIR',
  FIRMWARE_UPDATE: 'FIRMWARE_UPDATE',
  FULL_OVERHAUL: 'FULL_OVERHAUL',
} as const
export type MaintenanceType = (typeof MaintenanceType)[keyof typeof MaintenanceType]
