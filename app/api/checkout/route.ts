import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { polar } from "@/lib/polar"
import { getProductId, type CheckoutProduct } from "@/lib/plans"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const VALID_PRODUCTS: CheckoutProduct[] = [
  "solo", "studio", "agency",
  "credits_starter", "credits_pro", "credits_power",
]

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const product = req.nextUrl.searchParams.get("product") as CheckoutProduct | null
  if (!product || !VALID_PRODUCTS.includes(product)) {
    return NextResponse.json(
      { error: "Invalid product", valid: VALID_PRODUCTS },
      { status: 400 }
    )
  }

  const productId = getProductId(product)
  if (!productId) {
    return NextResponse.json(
      { error: "Product not configured" },
      { status: 500 }
    )
  }

  // Get user email for pre-fill
  const user = db.prepare("SELECT email FROM users WHERE id = ?")
    .get(session.sub) as { email: string } | undefined

  const baseUrl = process.env.BASE_URL || "https://arbo.patchou.cloud"
  const isCredits = product.startsWith("credits_")
  // Credits purchases: return to current page (embed handles it). Lifetime: go to account.
  const successUrl = isCredits
    ? `${baseUrl}/?credits=success`
    : `${baseUrl}/account?upgrade=success`

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      metadata: { userId: session.sub },
      customerEmail: user?.email || undefined,
      successUrl,
      embedOrigin: baseUrl,
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error("[checkout] Polar error:", err)
    return NextResponse.json({ error: "Checkout creation failed" }, { status: 500 })
  }
}
