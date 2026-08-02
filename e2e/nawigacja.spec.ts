import { expect, test } from '@playwright/test'

test.describe('nawigacja', () => {
  test('otwiera się na cytacie dnia i przechodzi przez wszystkie zakładki', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Cytat dnia' })).toBeVisible()

    for (const [etykieta, naglowek] of [
      ['Odkrywaj', 'Odkrywaj'],
      ['Losuj', 'Losuj'],
      ['Talia', 'Talia'],
      ['Szukaj', 'Szukaj'],
      ['Zbiory', 'Zbiory'],
    ] as const) {
      await page.getByRole('link', { name: etykieta, exact: true }).first().click()
      await expect(page.getByRole('heading', { name: naglowek, exact: true })).toBeVisible()
    }
  })

  test('z cytatu dnia da się dojść do autora i wrócić', async ({ page }) => {
    await page.goto('/')
    const autor = page.locator('main a[href^="#/autor/"]').first()
    const nazwa = (await autor.innerText()).split('\n')[1]
    await autor.click()

    await expect(page.getByRole('heading', { level: 1 })).toContainText(nazwa)
    await expect(page.locator('main article')).not.toHaveCount(0)

    await page.getByRole('button', { name: 'Wstecz' }).click()
    await expect(page.getByRole('heading', { name: 'Cytat dnia' })).toBeVisible()
  })

  test('nieznana trasa nie wywraca aplikacji', async ({ page }) => {
    await page.goto('/#/nie-ma-takiej-strony')
    await expect(page.getByRole('heading', { name: 'Cytat dnia' })).toBeVisible()
  })
})
