"use client"

import { useCallback } from "react"

interface Props {
  checkoutUrl: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export default function PolarCheckoutButton({ checkoutUrl, className, style, children }: Props) {
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed")
    const checkout = await PolarEmbedCheckout.create(checkoutUrl, { theme: "dark" })
    checkout.addEventListener("success", () => {
      window.location.href = "/account?upgrade=success"
    })
  }, [checkoutUrl])

  return (
    <button onClick={handleClick} className={className} style={style}>
      {children}
    </button>
  )
}
