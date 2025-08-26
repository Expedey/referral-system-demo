"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { CircleIcon } from "@/components/circle";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [token, setToken] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is in password reset mode
    const checkPasswordResetMode = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Reset password page - Session check:", session);
        
        if (session?.user) {
          // User has a valid session, check if they're in password reset mode
          // This happens when Supabase redirects from email reset link
          console.log("Reset password page - Valid session found:", session.user);
          setTokenValid(true);
          setToken("valid-session"); // We don't need the actual token for Supabase
        } else {
          // No valid session, check if there's a token in URL (fallback)
          const tokenParam = searchParams.get("token");
          console.log("Reset password page - No session, token param:", tokenParam);
          if (tokenParam) {
            setToken(tokenParam);
            setTokenValid(true);
          } else {
            setTokenValid(false);
          }
        }
      } catch (error) {
        console.error("Error checking password reset mode:", error);
        setTokenValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPasswordResetMode();
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, formData.password);
      router.push("/dashboard");
    //   setSuccess(true);
      

    } catch (error) {
        console.log(error)
      setErrors({
        submit: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Checking reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Image Section (60%) */}
        <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full h-full">
            <a href={process.env.NEXT_PUBLIC_LANDING_PAGE_URL} className="mb-8">
              <Image
                src="/Logo.svg"
                alt="Logo"
                width={120}
                height={120}
                className="mb-6"
              />
            </a>
            <h1 className="text-4xl font-bold mb-4 text-center">
              Password Reset!
            </h1>
            <p className="text-xl text-center mb-8 opacity-90 max-w-md">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <div className="flex items-center space-x-4 text-sm opacity-75">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span>Successfully Reset</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span>Ready to Sign In</span>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white opacity-10 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white opacity-10 rounded-full"></div>
          <div className="absolute top-1/2 left-10 w-16 h-16 bg-white opacity-10 rounded-full"></div>
        </div>

        {/* Right Side - Success Section (40%) */}
        <div className="w-full lg:w-2/5 flex items-center justify-center px-8 py-12 bg-white dark:bg-gray-900">
          <div className="w-full max-w-md space-y-8 text-center">
            {/* Mobile Logo */}
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
                Success!
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/signin")}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Section (60%) */}
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
            Reset Your Password
          </h1>
          <p className="text-xl text-center mb-8 opacity-90 max-w-md">
            Enter your new password below to complete the reset process
          </p>
          <div className="flex items-center space-x-4 text-sm opacity-75">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Secure Reset</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span>Almost Done</span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full">
        <CircleIcon fillColor="white" className="w-full h-full opacity-10"/>
        </div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full">
        <CircleIcon fillColor="white" className="w-full h-full opacity-10"/>
        </div>
        <div className="absolute top-1/2 left-10 w-16 h-16 rounded-full">
        <CircleIcon fillColor="white" className="w-full h-full opacity-10"/>
        </div>
      </div>

      {/* Right Side - Form Section (40%) */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-8 py-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
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
              New Password
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your new password below
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Input
                label="New Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                error={errors.password}
                required
                autoComplete="new-password"
                placeholder="Enter your new password"
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
                placeholder="Confirm your new password"
              />
            </div>

            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              disabled={loading}
            >
              Reset Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
