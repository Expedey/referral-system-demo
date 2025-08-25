"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Forgot password - Sending reset email for:", email);
      const result = await forgotPassword(email);
      console.log("Forgot password - Result:", result);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch (err) {
      console.error("Forgot password - Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full h-full">
            <div className="mb-8">
              <Image
                src="/Logo.svg"
                alt="Logo"
                width={120}
                height={120}
                className="mb-6"
              />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-center">
              Check Your Email
            </h1>
            <p className="text-xl text-center mb-8 opacity-90 max-w-md">
              We&apos;ve sent you a password reset link. Please check your email and follow the instructions.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-2/5 flex items-center justify-center px-8 py-12 bg-white dark:bg-gray-900">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="lg:hidden text-center mb-8">
              <Image
                src="/Logo.svg"
                alt="Logo"
                width={80}
                height={80}
                className="mx-auto mb-4"
              />
            </div>

            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Email Sent!
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300">
                We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your email and click the link to reset your password.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/signin")}
                className="w-full"
              >
                Back to Sign In
              </Button>
              
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Didn&apos;t receive the email?{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full h-full">
          <div className="mb-8">
            <Image
              src="/Logo.svg"
              alt="Logo"
              width={120}
              height={120}
              className="mb-6"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">
            Forgot Password?
          </h1>
          <p className="text-xl text-center mb-8 opacity-90 max-w-md">
            No worries! Enter your email and we&apos;ll send you reset instructions
          </p>
          <div className="flex items-center space-x-4 text-sm opacity-75">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Secure Reset</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span>Quick & Easy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center px-8 py-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/Logo.svg"
              alt="Logo"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="Enter your email address"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              disabled={loading}
            >
              Send Reset Link
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Remember your password?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
