"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth-client"
import { Form, Field as FormischField, useForm } from "@formisch/react"
import type { SubmitHandler } from "@formisch/react"
import * as v from "valibot"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const RegisterSchema = v.object({
  name: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your name."),
    v.minLength(3, "Name must be at least 3 characters.")
  ),
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted.")
  ),
  password: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your password."),
    v.minLength(8, "Password must be at least 8 characters.")
  )
})

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    schema: RegisterSchema,
    initialInput: {
      name: "",
      email: "",
      password: ""
    }
  })

  const handleRegister: SubmitHandler<typeof RegisterSchema> = async (output) => {
    setLoading(true)
    const { data, error } = await signUp.email({
      email: output.email,
      password: output.password,
      name: output.name,
    })

    if (error) {
      toast.error(error.message || "Failed to register")
      setLoading(false)
      return
    }

    toast.success("Registration successful! Please verify your email.")
    router.push(`/verify?email=${encodeURIComponent(output.email)}`)
    setLoading(false)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form of={form} className="p-6 md:p-12 flex flex-col justify-center" onSubmit={handleRegister}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-3xl font-bold text-foreground">Create an account</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your details to create your Cranberry Juice account
                </p>
              </div>

              <FormischField of={form} path={["name"]}>
                {(field) => (
                  <Field data-invalid={field.errors !== null}>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      {...field.props}
                      id="name"
                      type="text"
                      placeholder="John Doe"
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
                    <FieldLabel htmlFor="password">Password</FieldLabel>
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

              <Field>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Creating account..." : "Sign up"}
                </Button>
              </Field>

              <FieldDescription className="text-center mt-2">
                Already have an account? <a href="/login" className="text-primary hover:text-primary/80">Sign in</a>
              </FieldDescription>
            </FieldGroup>
          </Form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
              alt="Abstract red liquid"
              className="absolute inset-0 h-full w-full object-cover opacity-80 dark:brightness-[0.6]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <h2 className="text-2xl font-bold text-white mb-2">Join the Revolution</h2>
              <p className="text-white/80">Build incredible AI agents effortlessly.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-muted-foreground">
        By clicking continue, you agree to our <a href="#" className="underline hover:text-foreground">Terms of Service</a>{" "}
        and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
