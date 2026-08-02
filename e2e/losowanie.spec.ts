import { expect, test } from '@playwright/test'

const trescCytatu = (page: import('@playwright/test').Page) =>
  page.locator('main .quote-serif').first().innerText()

test.describe('losowanie', () => {
  test('każde losowanie daje inny cytat i rzadko powtarza autora', async ({ page }) => {
    await page.goto('/#/losuj')
    await expect(page.getByRole('heading', { name: 'Losuj' })).toBeVisible()

    const cytaty: string[] = []
    const autorzy: string[] = []

    for (let i = 0; i < 12; i++) {
      cytaty.push(await trescCytatu(page))
      autorzy.push(
        (await page.locator('main a[href^="#/autor/"]').first().getAttribute('href')) ?? '',
      )
      await page.getByRole('button', { name: 'Losuj kolejny' }).click()
      await page.waitForTimeout(120)
    }

    expect(new Set(cytaty).size).toBeGreaterThan(9)
    // Kluczowa regresja: powtarzanie tego samego autora pod rząd.
    const podRzad = autorzy.filter((a, i) => i > 0 && a === autorzy[i - 1])
    expect(podRzad).toEqual([])
  })

  test('filtr zawęża pulę i jest widoczny po zwinięciu panelu', async ({ page }) => {
    await page.goto('/#/losuj')
    const stopka = page.locator('main p').filter({ hasText: 'Losowanie z' })
    await expect(stopka).toContainText('511')

    await page.getByRole('button', { name: 'Filtry', exact: true }).click()
    await page.getByRole('button', { name: '🃏 Humor' }).click()
    await expect(stopka).toContainText('(po filtrach)')

    // Panel zwinięty — filtr nadal musi być widoczny, inaczej zawężona pula
    // wygląda jak zepsute losowanie.
    const aktywne = page.getByRole('group', { name: 'Aktywne filtry' })
    await expect(aktywne).toContainText('Humor')
    await page.getByRole('button', { name: 'Filtry', exact: true }).click()
    await expect(aktywne).toContainText('Humor')

    await aktywne.getByRole('button', { name: 'wyczyść wszystkie' }).click()
    await expect(stopka).toContainText('511')
  })

  test('klawisz R losuje kolejny cytat', async ({ page }) => {
    await page.goto('/#/losuj')
    const przed = await trescCytatu(page)
    await page.locator('body').press('r')
    await page.waitForTimeout(200)
    expect(await trescCytatu(page)).not.toBe(przed)
  })
})
