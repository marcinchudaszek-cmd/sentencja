import { expect, test } from '@playwright/test'

test.describe('zbiory', () => {
  test('ulubione przeżywają przeładowanie strony', async ({ page }) => {
    await page.goto('/#/losuj')
    const cytat = await page.locator('main .quote-serif').first().innerText()

    await page.getByRole('button', { name: 'Dodaj do ulubionych' }).click()
    await page.goto('/#/zbiory')
    await expect(page.locator('main article').first()).toContainText(cytat.slice(0, 30))

    await page.reload()
    await page.goto('/#/zbiory')
    await expect(page.locator('main article').first()).toContainText(cytat.slice(0, 30))
  })

  test('cytat trafia do nowej kolekcji', async ({ page }) => {
    await page.goto('/#/cytat/a025')
    await page.getByRole('button', { name: 'Kolekcja' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('Nowa kolekcja…').fill('Na trudne dni')
    await dialog.getByRole('button', { name: 'Dodaj' }).click()
    await page.getByRole('button', { name: 'Gotowe' }).click()

    await page.goto('/#/zbiory')
    await page.getByRole('button', { name: 'kolekcje' }).click()
    await page.getByRole('link', { name: /Na trudne dni/ }).click()

    await expect(page.locator('main article')).toHaveCount(1)
    await expect(page.locator('main article')).toContainText('ośmielamy')
  })

  test('notatka zapisuje się przy cytacie', async ({ page }) => {
    await page.goto('/#/cytat/a041')
    await page.getByText('Dodaj własną notatkę…').click()
    await page.getByRole('textbox').fill('Do przemowy na urodziny')
    await page.getByRole('button', { name: 'Zapisz' }).click()

    await page.goto('/#/zbiory')
    await page.getByRole('button', { name: 'notatki' }).click()
    await expect(page.getByText('Do przemowy na urodziny')).toBeVisible()
  })
})
