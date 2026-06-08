"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { Form, Field as FormischField, useForm } from "@formisch/react"
import type { SubmitHandler } from "@formisch/react"
import * as v from "valibot"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TurnstileWidget } from "@/components/turnstile-widget"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const LoginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted.")
  ),
  password: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your password.")
  )
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const form = useForm({
    schema: LoginSchema,
    initialInput: {
      email: "",
      password: ""
    }
  })

  const handleLogin: SubmitHandler<typeof LoginSchema> = async (output) => {
    if (!turnstileToken) {
      toast.error("Please complete the Turnstile challenge")
      return
    }

    setLoading(true)
    const { data, error } = await signIn.email({
      email: output.email,
      password: output.password,
    })

    if (error) {
      toast.error(error.message || "Invalid credentials")
      setLoading(false)
      return
    }

    toast.success("Login successful")
    router.push("/chat")
    router.refresh()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form of={form} className="p-6 md:p-12 flex flex-col justify-center" onSubmit={handleLogin}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your Cranberry Juice account
                </p>
              </div>

              <FormischField of={form} path={["email"]}>
                {(field) => (
                  <Field data-invalid={field.errors !== null}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field.props}
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={field.input ?? ""}
                      aria-invalid={field.errors !== null}
                    />
                    {field.errors && (
                      <FieldError
                        errors={field.errors.map((message) => ({ message }))}
                      />
                    )}
                  </Field>
                )}
              </FormischField>

              <FormischField of={form} path={["password"]}>
                {(field) => (
                  <Field data-invalid={field.errors !== null}>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <a
                        href="#"
                        className="ml-auto text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
                      {...field.props}
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={field.input ?? ""}
                      aria-invalid={field.errors !== null}
                    />
                    {field.errors && (
                      <FieldError
                        errors={field.errors.map((message) => ({ message }))}
                      />
                    )}
                  </Field>
                )}
              </FormischField>

              <div className="pt-2 pb-2 flex justify-center">
                <TurnstileWidget onSuccess={(token) => setTurnstileToken(token)} />
              </div>

              <Field>
                <Button
                  type="submit"
                  disabled={loading || !turnstileToken}
                  className="w-full mt-4"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Field>

              <FieldDescription className="text-center mt-2">
                Don&apos;t have an account? <a href="/register" className="text-primary hover:text-primary/80">Sign up</a>
              </FieldDescription>
            </FieldGroup>
          </Form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop"
              alt="Abstract red waves"
              className="absolute inset-0 h-full w-full object-cover opacity-80 dark:brightness-[0.7]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <h2 className="text-2xl font-bold text-white mb-2">Build faster with AI</h2>
              <p className="text-white/80">Cranberry Juice helps you orchestrate your AI agents.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-muted-foreground">
        By clicking login, you agree to our <a href="#" className="underline hover:text-foreground">Terms of Service</a>{" "}
        and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
