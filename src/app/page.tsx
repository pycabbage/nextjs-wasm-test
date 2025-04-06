import Add from "@/components/Add"
import { add } from "@nextjs-wasm-test/wasm"

export default async function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl">
        example: 2 + 3 = {add(2, 3)}
      </h2>
      <Add />
    </div>
  )
}
