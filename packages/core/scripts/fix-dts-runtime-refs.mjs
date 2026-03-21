import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

const declarationFiles = ['index.d.ts', 'index.d.cts']
const createdFiles = []

for (const declarationFile of declarationFiles) {
  const declarationPath = path.join(distDir, declarationFile)
  const source = await readFile(declarationPath, 'utf8')
  const matches = source.matchAll(/import ['"](\.\/[^'"]+\.(?:js|cjs))['"]/g)

  for (const match of matches) {
    const runtimeRelativePath = match[1]
    const runtimePath = path.resolve(distDir, runtimeRelativePath)

    await mkdir(path.dirname(runtimePath), { recursive: true })
    await writeFile(runtimePath, 'export {}\n', 'utf8')
    createdFiles.push(path.relative(distDir, runtimePath))
  }
}

if (createdFiles.length > 0) {
  console.log(`Created declaration runtime stubs: ${createdFiles.join(', ')}`)
}
