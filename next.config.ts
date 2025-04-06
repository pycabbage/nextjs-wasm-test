import type { NextConfig } from "next"
import { access, symlink } from "node:fs/promises"
import { join } from "node:path"
// import { join } from "path"
import type { Configuration, WebpackPluginInstance, Compiler } from "webpack"



const nextConfig: NextConfig = {
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

export default nextConfig
