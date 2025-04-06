import type { NextConfig } from "next"
import { access, symlink } from "node:fs/promises"
import { join } from "node:path"
import { env } from "node:process"
import type { Configuration, WebpackPluginInstance, Compiler } from "webpack"
import * as pagesConfig from "./next.config.pages.mjs"

function deepmerge<T1, T2>(obj_a: Partial<T1>, obj_b: Partial<T2>): T1 & T2 {
  const merged = { ...obj_a } as Partial<T1 & T2>
  for (const key in obj_b) {
    if (key in merged && typeof merged[key] === "object") {
      //@ts-expect-error
      merged[key] = deepmerge(merged[key], obj_b[key])
    } else {
      //@ts-expect-error
      merged[key] = obj_b[key]
    }
  }
  return merged as T1 & T2
}

const nextConfig: NextConfig = {
  output: Object.keys(env).includes("GITHUB_ACTIONS")
    ? "export"
    : Object.keys(env).includes("NEXT_OUTPUT")
      ? (env.NEXT_OUTPUT as "export" | "standalone")
      : undefined,
  /* config options here */
  webpack(config: Configuration, { isServer }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // define plugin
    class SymlinkWebpackPlugin implements WebpackPluginInstance {
      apply(compiler: Compiler) {
        compiler.hooks.afterEmit.tapPromise(
          "SymlinkWebpackPlugin",
          async (compiler) => {
            if (isServer) {
              const from = join(compiler.options.output.path || "", "../static")
              const to = join(compiler.options.output.path || "", "static")

              try {
                await access(from)
                return
                // biome-ignore lint/suspicious/noExplicitAny:
              } catch (error: any) {
                if (error?.code !== "ENOENT") {
                  throw error
                }
              }

              await symlink(to, from, "junction")
              console.log(`created symlink ${from} -> ${to}`)
            }
          }
        )
      }
    }

    // add plugin
    if (!config.plugins) config.plugins = []
    config.plugins.push(new SymlinkWebpackPlugin())
    return config
  },
}

export default deepmerge(pagesConfig, nextConfig)
