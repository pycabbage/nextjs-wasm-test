"use client"

import { add } from "@nextjs-wasm-test/wasm"
import { useReducer, useState } from "react"

const inputCN = "border border-gray-300 rounded-md p-2 outline-none not-read-only:focus:border-blue-500 not-read-only:focus:ring-1 not-read-only:focus:ring-blue-500 transition duration-200"
const buttonCN = "bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600 transition duration-200 cursor-pointer"

export default function Add() {
  const initialValue = {
    a: 5,
    b: 7,
  }
  const [result, setResult] = useState(() => add(initialValue.a, initialValue.b))
  return <form className="flex flex-col gap-2" action={formData => {
    const {a, b} = Object.fromEntries(formData.entries().map(([key, value]) => [key, Number(value)])) as {
      a: number
      b: number
    }
    setResult(add(a, b))
  }}>
    <label>
      <span>First number</span>
      <input type="number" name="a" className={`${inputCN}`} defaultValue={initialValue.a} />
    </label>
    <label>
      <span>Second number</span>
      <input type="number" name="b" className={`${inputCN}`} defaultValue={initialValue.b} />
    </label>
    <label>
      <span>Result</span>
      <input type="number" name="c" readOnly={true} value={result} className={`${inputCN}`} />
    </label>
    <input type="submit" value="Add" className={`${buttonCN}`} />
  </form>
}
