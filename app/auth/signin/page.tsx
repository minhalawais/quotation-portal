"use client"

import type React from "react"
import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, Eye, EyeOff, CheckCircle, Lock, Mail, ArrowRight } from "lucide-react"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials. Please check your email and password.")
        setLoading(false)
      } else {
        setSuccess(true)
        // Keep loading state for a moment to show success
        setTimeout(async () => {
          const session = await getSession()
          if (session?.user?.role === "manager") {
            router.push("/dashboard")
          } else {
            router.push("/products")
          }
        }, 1000)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const fillDemoCredentials = (type: "manager" | "rider") => {
    if (type === "manager") {
      setEmail("admin@inventory.com")
      setPassword("admin123")
    } else {
      setEmail("rider@inventory.com")
      setPassword("rider123")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-primary/5 to-secondary/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-success/10 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fillRule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23000000&quot; fillOpacity=&quot;0.02&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;1&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      <div className="relative w-full max-w-md z-10">
        <Card className="card-modern shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-8">
            {/* Logo and branding */}
            <div className="mx-auto w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg relative">
              <Building2 className="h-10 w-10 text-white" />
              <div className="absolute inset-0 rounded-2xl bg-white/20 backdrop-blur-sm"></div>
            </div>

            <CardTitle className="text-3xl font-bold text-secondary mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Sign in to your Inventory Portal
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="alert-error slide-up">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="alert-success slide-up">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    Login successful! Redirecting to dashboard...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-modern mobile-input bg-white/80 backdrop-blur-sm"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-modern mobile-input bg-white/80 backdrop-blur-sm pr-12"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full mobile-button font-semibold shadow-lg transition-all duration-300 transform ${
                  success ? "btn-success hover:bg-success/90" : "btn-primary hover:shadow-xl hover:-translate-y-0.5"
                }`}
                disabled={loading}
              >
                {loading ? (
                  success ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Logged In Successfully!
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  )
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo credentials section */}
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Quick Demo Access</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fillDemoCredentials("manager")}
                  className="w-full mobile-button hover:bg-primary/5 hover:border-primary/30 hover:text-primary"
                  disabled={loading}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-3 w-3 text-primary" />
                      </div>
                      <span className="font-medium">Manager Demo</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Full Access</span>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fillDemoCredentials("rider")}
                  className="w-full mobile-button hover:bg-secondary/5 hover:border-secondary/30 hover:text-secondary"
                  disabled={loading}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-secondary">R</span>
                      </div>
                      <span className="font-medium">Rider Demo</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Limited Access</span>
                  </div>
                </Button>
              </div>

              {/* Credentials display */}
              <div className="bg-muted/50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Demo Credentials
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
                    <span className="font-medium text-secondary">Manager:</span>
                    <span className="font-mono text-muted-foreground">admin@inventory.com</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
                    <span className="font-medium text-secondary">Rider:</span>
                    <span className="font-mono text-muted-foreground">rider@inventory.com</span>
                  </div>
                  <p className="text-center text-muted-foreground mt-2">
                    Password for both: <span className="font-mono font-semibold">admin123 / rider123</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-muted-foreground">Inventory Portal © 2024 - Professional Business Solutions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
