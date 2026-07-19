/**
 * Rasterizes the brand SVG into the PNG sizes required by the PWA manifest
 * and iOS home screen. Run after changing public/icons/icon.svg:
 *
 *   npm run icons
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const iconsDir = path.join(root, 'public', 'icons')
const svg = await readFile(path.join(iconsDir, 'icon.svg'), 'utf8')

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-512-maskable.png', size: 512, maskablePadding: 0.12 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const target of targets) {
  let source = svg
  if (target.maskablePadding) {
    // Maskable icons need safe-zone padding so launchers can crop any shape.
    const inset = Math.round(512 * target.maskablePadding)
    const scale = (512 - inset * 2) / 512
    source = svg.replace(
      '<rect width="512" height="512" rx="116"',
      `<rect width="512" height="512" rx="0" fill="#09090b"/><g transform="translate(${inset} ${inset}) scale(${scale})"><rect width="512" height="512" rx="116"`,
    )
    source = source.replace('</svg>', '</g></svg>')
  }
  const rendered = new Resvg(source, {
    fitTo: { mode: 'width', value: target.size },
  }).render()
  await writeFile(path.join(iconsDir, target.file), rendered.asPng())
  console.log(`wrote ${target.file} (${target.size}px)`)
}
