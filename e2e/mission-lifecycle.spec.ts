import { test, expect } from '@playwright/test'

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

test('full lifecycle: create drone → schedule mission → transitions → dashboard verify', async ({ page }) => {
  // --- Unique identifiers for this test run ---
  const ts = Date.now()
  const seg1 = ts.toString().slice(-8, -4) // 4 digits
  const seg2 = ts.toString().slice(-4)      // 4 digits
  const serialNumber = `SKY-${seg1}-${seg2}`
  const missionName = `E2E Mission ${ts}`

  const now = new Date()
  const plannedStart = toDatetimeLocal(new Date(now.getTime() + 60 * 60 * 1000))    // +1h
  const plannedEnd = toDatetimeLocal(new Date(now.getTime() + 3 * 60 * 60 * 1000))  // +3h

  // ===== STEP 1: Navigate to Drones page =====
  await page.goto('/drones')
  await expect(page.getByRole('heading', { name: 'Drones' })).toBeVisible()

  // ===== STEP 2: Open "New Drone" modal =====
  await page.getByRole('button', { name: '+ New Drone' }).click()
  await expect(page.getByRole('heading', { name: 'New Drone' })).toBeVisible()

  // ===== STEP 3: Fill drone form =====
  await page.getByPlaceholder('SKY-XXXX-XXXX').fill(serialNumber)
  // Only one select in the drone modal — model select
  await page.locator('select').first().selectOption('PHANTOM_4')
  await page.getByRole('button', { name: 'Create' }).click()

  // ===== STEP 4: Verify drone appears in list =====
  await expect(page.getByText(serialNumber)).toBeVisible({ timeout: 10_000 })

  // ===== STEP 5: Navigate to drone detail via "View" link =====
  await page.locator('tr', { hasText: serialNumber }).getByRole('link', { name: 'View' }).click()

  // ===== STEP 6: Verify URL and AVAILABLE status =====
  await expect(page).toHaveURL(/\/drones\/[a-f0-9-]+/)
  await expect(page.getByText('AVAILABLE')).toBeVisible()

  // ===== STEP 7: Navigate to Missions page =====
  await page.goto('/missions')
  await expect(page.getByRole('heading', { name: 'Missions' })).toBeVisible()

  // ===== STEP 8: Open "New Mission" modal =====
  await page.getByRole('button', { name: '+ New Mission' }).click()
  await expect(page.getByRole('heading', { name: 'New Mission' })).toBeVisible()

  // ===== STEP 9: Fill mission form =====
  await page.locator('[data-testid="mission-name"]').fill(missionName)
  await page.locator('[data-testid="mission-type"]').selectOption('WIND_TURBINE_INSPECTION')

  // Wait for drone options to load, then select our drone
  const droneSelect = page.locator('[data-testid="mission-drone"]')
  await expect(droneSelect.locator(`option:has-text("${serialNumber}")`)).toBeAttached({ timeout: 10_000 })
  await droneSelect.selectOption({ label: serialNumber })

  await page.locator('[data-testid="mission-pilot"]').fill('E2E Pilot')
  await page.locator('[data-testid="mission-site"]').fill('E2E Site')
  await page.locator('[data-testid="mission-start"]').fill(plannedStart)
  await page.locator('[data-testid="mission-end"]').fill(plannedEnd)
  await page.getByRole('button', { name: 'Create' }).click()

  // ===== STEP 10: Verify mission in list with PLANNED status =====
  await expect(page.getByText(missionName)).toBeVisible({ timeout: 10_000 })
  await expect(
    page.locator('tr', { hasText: missionName }).getByText('PLANNED'),
  ).toBeVisible()

  // ===== STEP 11: Navigate to mission detail =====
  await page.locator('tr', { hasText: missionName }).getByRole('link', { name: 'View' }).click()
  await expect(page).toHaveURL(/\/missions\/[a-f0-9-]+/)

  // ===== STEP 12: PLANNED → PRE_FLIGHT_CHECK =====
  await page.locator('[data-testid="transition-PRE_FLIGHT_CHECK"]').click()
  await page.locator('[data-testid="confirm-transition"]').click()
  await expect(page.getByText('PRE FLIGHT CHECK')).toBeVisible({ timeout: 10_000 })

  // ===== STEP 13: PRE_FLIGHT_CHECK → IN_PROGRESS =====
  await page.locator('[data-testid="transition-IN_PROGRESS"]').click()
  await page.locator('[data-testid="confirm-transition"]').click()
  await expect(page.getByText('IN PROGRESS')).toBeVisible({ timeout: 10_000 })

  // ===== STEP 14: IN_PROGRESS → COMPLETED (with 2.5 flight hours) =====
  await page.locator('[data-testid="transition-COMPLETED"]').click()
  const flightHoursInput = page.locator('[data-testid="flight-hours-input"]')
  await expect(flightHoursInput).toBeVisible()
  await flightHoursInput.fill('2.5')
  await page.locator('[data-testid="confirm-transition"]').click()

  // ===== STEP 15: Verify COMPLETED status =====
  await expect(page.getByText('COMPLETED')).toBeVisible({ timeout: 10_000 })
  // Transition buttons should be gone
  await expect(page.locator('[data-testid^="transition-"]')).not.toBeVisible()

  // ===== STEP 16-17: Dashboard verification =====
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Recent missions section should contain our completed mission
  await expect(page.getByText(missionName)).toBeVisible({ timeout: 10_000 })

  // Average flight hours should be > 0 (rendered as "X.X")
  const avgText = await page.locator('text=/\\d+\\.\\d+ h|avg/i').first().textContent()
  expect(avgText).toBeTruthy()

  // ===== Bonus: Verify drone's flight hours updated on Drones list =====
  await page.goto('/drones')
  await expect(page.getByText(serialNumber)).toBeVisible()
  // After completing the mission with 2.5h, the drone row should show updated flight hours
  const droneRow = page.locator('tr', { hasText: serialNumber })
  await expect(droneRow).toContainText('2.5 h')
})
