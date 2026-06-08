"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { MailCheckIcon, RefreshCwIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultEmail = searchParams.get("email") || ""

  const [email] = useState(defaultEmail)
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleVerify = async () => {
    if (otp.length < 6) return
    setLoading(true)

    const { error } = await authClient.emailOtp.verifyEmail({ email, otp })

    if (error) {
      toast.error(error.message || "Invalid or expired code")
      setLoading(false)
      return
    }

    toast.success("Email verified successfully!")
    router.push("/chat")
    router.refresh()
  }

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setResending(true)
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    })

    if (error) {
      toast.error(error.message || "Failed to resend code")
    } else {
      toast.success("Verification code sent to your email")
    }
    setResending(false)
  }

  // Auto-submit when 6 digits are filled
  const handleOtpChange = (value: string) => {
    setOtp(value)
    if (value.length === 6) {
      // slight delay so user sees the last digit
      setTimeout(() => {
        setLoading(true)
        authClient.emailOtp.verifyEmail({ email, otp: value }).then(({ error }) => {
          if (error) {
            toast.error(error.message || "Invalid or expired code")
            setLoading(false)
          } else {
            toast.success("Email verified successfully!")
            router.push("/chat")
            router.refresh()
          }
        })
      }, 300)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Back link */}
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to login
      </Link>

      {/* Icon badge */}
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <MailCheckIcon className="size-7 text-primary" />
      </div>

      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground">
        Check your email
      </h1>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        We sent a 6-digit code to{" "}
        {email ? (
          <span className="font-medium text-foreground">{email}</span>
        ) : (
          "your email address"
        )}
        . Enter it below to verify your account.
      </p>

      {/* OTP Input */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={handleOtpChange}
          disabled={loading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-xs text-muted-foreground">
          {loading ? "Verifying…" : "Enter the 6-digit code"}
        </p>
      </div>

      {/* Submit button (manual fallback) */}
      <Button
        className="mt-6 w-full"
        onClick={handleVerify}
        disabled={loading || otp.length < 6}
      >
        {loading ? "Verifying…" : "Verify email"}
      </Button>

      {/* Resend */}
      <div className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground">
        Didn&apos;t receive it?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || !email}
          className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50 transition-opacity"
        >
          {resending ? (
            <>
              <RefreshCwIcon className="size-3 animate-spin" />
              Sending…
            </>
          ) : (
            "Resend code"
          )}
        </button>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm animate-pulse space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="mt-8 h-14 w-full rounded-lg bg-muted" />
      </div>
    }>
      <VerifyForm />
    </Suspense>
  )
}
