import client from './client'
import type { FleetHealthResponse } from '../types'

export const fleetHealthApi = {
  get: () =>
    client.get<FleetHealthResponse>('/fleet-health').then((r) => r.data),
}
