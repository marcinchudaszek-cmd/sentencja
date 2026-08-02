import { expect, test } from '@playwright/test'

test.describe('generator grafik', () => {
  test('rysuje kartę i zmienia ją wraz z motywem', async ({ page }) => {
    await page.goto('/#/studio/a025')
    const canvas = page.locator('main canvas')
    await expect(canvas).toBeVisible()

    const odcisk = () =>
      canvas.evaluate((c: HTMLCanvasElement) => {
        const ctx = c.getContext('2d')!
        const d = ctx.getImageData(0, 0, c.width, c.height).data
        let suma = 0
        for (let i = 0; i < d.length; i += 997) suma = (suma + d[i]) % 1_000_000
        return { w: c.width, h: c.height, suma }
      })

    const kwadrat = await odcisk()
    expect(kwadrat.w).toBe(1080)
    expect(kwadrat.h).toBe(1080)

    await page.getByRole('button', { name: /Papier/ }).click()
    const papier = await odcisk()
    expect(papier.suma).not.toBe(kwadrat.suma)

    await page.getByRole('button', { name: /Story/ }).click()
    const story = await odcisk()
    expect(story.h).toBe(1920)
  })
})

test.describe('oś czasu', () => {
  test('rysuje wszystkich autorów i pozwala wybrać jednego', async ({ page }) => {
    await page.goto('/#/os-czasu')
    const os = page.locator('main svg[role="img"]')
    await expect(os).toBeVisible()
    expect(await os.locator('circle').count()).toBeGreaterThan(200)

    await os.locator('circle').nth(30).click()
    const karta = page.locator('main a[href^="#/autor/"]').first()
    await expect(karta).toBeVisible()
    await expect(karta).toContainText('w bazie')
  })

  test('skrót epoki przewija oś', async ({ page }) => {
    await page.goto('/#/os-czasu')
    const kontener = page.locator('[role="group"]')
    expect(await kontener.evaluate((el) => el.scrollLeft)).toBe(0)

    await page.getByRole('button', { name: 'Wiek XX', exact: true }).click()
    await page.waitForTimeout(700)
    expect(await kontener.evaluate((el) => el.scrollLeft)).toBeGreaterThan(1000)
  })
})
