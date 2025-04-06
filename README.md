# nextjs-wasm-test

```shell
# Build standaalone Next.js server image
docker build -t nextjs-wasm-test:runner --target runner .
# Build static Next.js app image
docker build -t nextjs-wasm-test:server --target server --build-arg NEXT_OUTPUT=export .
```
