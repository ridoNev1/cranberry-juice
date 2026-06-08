import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { emailOTP } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "./prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await resend.emails.send({
          from: `Cranberry Juice <noreply@${process.env.RESEND_DOMAIN}>`,
          to: email,
          subject: type === "sign-in" 
            ? "Your login code" 
            : "Verify your email",
          html: `<p>Your verification code is: <strong>${otp}</strong></p>
                 <p>This code expires in 10 minutes.</p>`,
        })
      },
    }),
    nextCookies(),
  ],
})
