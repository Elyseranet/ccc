import { describe, expect, it } from 'vitest'
import { PAGE_DELIVERY } from '../../src/consts/page-delivery.const'
import { ROUTES } from '../../src/consts/routes.const'
import { LAYOUT } from '../../src/enums/layout.enum'
import { buildRobotsTxt, buildSitemapPaths, buildSitemapXml, escapeXml, isSeoPrivateRoute, listSitemapStaticPaths } from '../../src/utils/seo.util'

const SITE = 'https://caps.example/'

describe('buildRobotsTxt', () => {
  it('interdit tout quand le site n’est pas indexable, sans annoncer de sitemap', () => {
    const txt = buildRobotsTxt(SITE, false)
    expect(txt).toBe('User-agent: *\nDisallow: /\n')
  })

  it('interdit les pages privées et l’API, et annonce le sitemap quand le site est indexable', () => {
    const lines = buildRobotsTxt(SITE, true).split('\n')
    for (const path of ['/admin', '/connexion', '/profil', '/invitation', '/api/']) {
      expect(lines).toContain(`Disallow: ${path}`)
    }
    expect(lines).not.toContain('Disallow: /')
    expect(lines).toContain('Sitemap: https://caps.example/sitemap.xml')
  })
})

describe('sitemap', () => {
  it('reconnaît les pages privées et légales, admin compris', () => {
    for (const path of [ROUTES.ADMIN, ROUTES.ADMIN_DRAWS, ROUTES.LOGIN, ROUTES.PROFILE, '/invitation/abc', ROUTES.LEGAL_NOTICE, ROUTES.PRIVACY, ROUTES.TERMS, ROUTES.ACCESSIBILITY]) {
      expect(isSeoPrivateRoute(path), path).toBe(true)
    }
    for (const path of [ROUTES.HOME, ROUTES.EDITIONS, '/editions/2026', '/administration']) {
      expect(isSeoPrivateRoute(path), path).toBe(false)
    }
  })

  it('les pages statiques sont les pages livrées, ni privées, ni légales, ni dynamiques', () => {
    const paths = listSitemapStaticPaths()
    expect(paths).toContain(ROUTES.HOME)
    expect(paths).toContain(ROUTES.HEAD_TO_HEAD)
    expect(paths.filter(path => path.includes(':') || isSeoPrivateRoute(path))).toEqual([])
    const undelivered = { '/a': { delivered: false, layout: LAYOUT.DEFAULT, endpoints: [] }, '/b': { delivered: true, layout: LAYOUT.DEFAULT, endpoints: [] } }
    expect(listSitemapStaticPaths(undelivered)).toEqual(['/b'])
  })

  it('ajoute une URL par édition et par joueur, encodée', () => {
    const paths = buildSitemapPaths(['2026', 'a b'], ['p1'])
    expect(paths).toContain('/editions/2026')
    expect(paths).toContain('/editions/a%20b')
    expect(paths).toContain('/joueurs/p1')
  })

  it('n’ajoute ni édition ni joueur quand leur page n’est pas livrée', () => {
    const table = { ...PAGE_DELIVERY, [ROUTES.EDITION]: { ...PAGE_DELIVERY[ROUTES.EDITION]!, delivered: false } }
    const paths = buildSitemapPaths(['2026'], ['p1'], table)
    expect(paths).not.toContain('/editions/2026')
    expect(paths).toContain('/joueurs/p1')
  })

  it('produit des URL absolues sur siteUrl et échappe le XML', () => {
    expect(escapeXml(`a&b<c>"d'`)).toBe('a&amp;b&lt;c&gt;&quot;d&apos;')
    const xml = buildSitemapXml(SITE, ['/', '/joueurs/a&b'])
    expect(xml).toContain('<loc>https://caps.example</loc>')
    expect(xml).toContain('<loc>https://caps.example/joueurs/a&amp;b</loc>')
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><urlset')).toBe(true)
  })
})
