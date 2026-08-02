import { expect, test } from '@playwright/test'

test.describe('wyszukiwarka', () => {
  test('znajduje mimo braku polskich znaków i filtruje po epoce', async ({ page }) => {
    await page.goto('/#/szukaj')
    await page.getByRole('textbox').fill('wolnosc')

    const licznik = page.locator('main div').filter({ hasText: /^\d+ wynik/ }).first()
    await expect(licznik).toBeVisible()
    await expect(page.locator('main article').first()).toContainText(/wolnoś/i)

    const przed = await page.locator('main article').count()
    await page.getByRole('button', { name: /^Antyk/ }).click()
    await expect(licznik).toContainText(' z ')
    expect(await page.locator('main article').count()).toBeLessThan(przed)
  })

  test('fraza w cudzysłowie szuka dosłownie', async ({ page }) => {
    await page.goto('/#/szukaj')
    const pole = page.getByRole('textbox')

    // Wyniki renderują się po deferred update, więc zanim policzymy karty,
    // czekamy aż pierwsza się pojawi — inaczej liczymy pusty ekran.
    await pole.fill('nic nie wiem')
    await expect(page.locator('main article').first()).toBeVisible()
    const luzne = await page.locator('main article').count()

    await pole.fill('"nic nie wiem"')
    await expect(page.locator('main article').first()).toBeVisible()
    const dokladne = await page.locator('main article').count()

    expect(dokladne).toBeGreaterThan(0)
    expect(dokladne).toBeLessThanOrEqual(luzne)
  })

  test('historia zapytań zapamiętuje wyszukiwanie', async ({ page }) => {
    await page.goto('/#/szukaj')
    await page.getByRole('textbox').fill('Seneka')
    await page.getByRole('textbox').press('Enter')

    await page.getByRole('textbox').fill('')
    const historia = page.getByRole('group', { name: 'Ostatnio szukane' })
    await expect(historia).toBeVisible()
    await expect(historia.getByRole('button', { name: 'Seneka', exact: true })).toBeVisible()
  })

  test('brak wyników pokazuje komunikat, nie pustkę', async ({ page }) => {
    await page.goto('/#/szukaj')
    await page.getByRole('textbox').fill('qwertyuiop')
    await expect(page.getByText('Nic nie pasuje')).toBeVisible()
  })
})
