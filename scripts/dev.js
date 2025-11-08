// 打包开发环境的
import { parseArgs } from 'node:util'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import esbuild from 'esbuild'

const {
  values: { format },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'esm',
    },
  },
})

// 创建 esm 的 __filename 和 __dirname 变量
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const target = positionals.length ? positionals[0] : 'vue'

const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`,
)

const require = createRequire(import.meta.url)
const pkg = require(`../packages/${target}/package.json`)

esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile, // 输出文件
    format, // 输出格式
    platform: format === 'cjs' ? 'node' : 'browser', // 平台
    sourcemap: true, // 生成 source map
    bundle: true, // 打包
    globalName: pkg.buildOptions.name,
  })
  .then(ctx => ctx.watch())
