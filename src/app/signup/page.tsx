"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { UserService } from "@/services/userService";
import { ReferralService } from "@/services/referralService";
import {
  storeReferralCode,
  clearStoredReferralCode,
} from "@/utils/parseReferral";
import { isValidReferralCode } from "@/utils/generateReferralCode";
import Button from "@/components/Button";
import Input from "@/components/Input";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user, loading: authLoading } = useAuth();

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [referralCode, setReferralCode] = React.useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = React.useState<{
    username?: string;
    referralCode: string;
  } | null>(null);

  // Check for referral code on page load
  React.useEffect(() => {
    console.log("[Signup] useEffect: Checking referral code...");
    const checkReferralCode = async () => {
      // Check URL parameters first
      const refParam = searchParams.get("ref");
      console.log("[Signup] searchParams ref:", refParam);
      if (refParam && isValidReferralCode(refParam)) {
        setReferralCode(refParam.toUpperCase());
        storeReferralCode(refParam.toUpperCase());
        // Get referrer info
        const referrer = await UserService.getUserByReferralCode(refParam);
        console.log("[Signup] Referrer from code:", referrer);
        if (referrer) {
          setReferrerInfo({
            username: referrer.username,
            referralCode: referrer.referral_code,
          });
        }
        return;
      }
      // Check stored referral code
      const storedCode = localStorage.getItem("referral_code");
      console.log("[Signup] storedCode:", storedCode);
      if (storedCode && isValidReferralCode(storedCode)) {
        setReferralCode(storedCode.toUpperCase());
        // Get referrer info
        const referrer = await UserService.getUserByReferralCode(storedCode);
        console.log("[Signup] Referrer from storedCode:", referrer);
        if (referrer) {
          setReferrerInfo({
            username: referrer.username,
            referralCode: referrer.referral_code,
          });
        }
      }
    };
    checkReferralCode();
  }, [searchParams]);

  // Redirect if already authenticated
  React.useEffect(() => {
    console.log("[Signup] useEffect: user, authLoading", user, authLoading);
    if (user && !authLoading) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.username && formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
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
      // --- CONTINUE WITH SIGNUP ---
      const result = await signUp(
        formData.email,
        formData.password,
        formData.username
      );
      console.log("[Signup] signUp result:", result);
      if (result.success) {
        // --- CREATE REFERRAL RECORD IF REFERRAL CODE PRESENT ---
        const referrerId = localStorage.getItem("referrer_id");
        if (referralCode && referrerId && result?.user?.id) {
          try {
                    // Get client IP (simple method)
        let clientIP = 'unknown';
        try {
          const response = await fetch('/api/referral');
          const data = await response.json();
          clientIP = data.ip;
          console.log(`[Signup] Detected IP: ${clientIP}`);
        } catch (error) {
          console.log(`[Signup] Could not detect IP:`, error);
        }

        // Create referral record with the correct user ID and IP
        await ReferralService.createReferral({
          referrerId: referrerId,
          referredEmail: formData.email,
          referredUserId: result.user.id,
          userIp: clientIP,
          userAgent: navigator.userAgent,
        });
            console.log("[Signup] Created referral record for:", formData.email);
            
            // Validate the referral
            const referralRes = await ReferralService.validateReferralOnSignup(
              formData.email,
              result.user.id,
              !!result.user.email_confirmed_at
            );
            console.log(
              "[Signup] ReferralService.validateReferralOnSignup:",
              referralRes
            );
          } catch (error) {
            console.error("[Signup] Error creating referral record:", error);
          }
        }
        clearStoredReferralCode();
        router.push("/dashboard");
      } else {
        setErrors({ submit: result.error || "Failed to sign up" });
      }
    } catch (error: unknown) {
      setErrors({
        submit: (error as Error).message || "An unexpected error occurred",
      });
      console.error("[Signup] Error in handleSubmit:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join the Waitlist
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account to get started
          </p>
        </div>

        {/* Referral Banner */}
        {referrerInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👋</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  You were invited by {referrerInfo.username || "a friend"}!
                </p>
                <p className="text-sm text-blue-700">
                  Referral code:{" "}
                  <span className="font-mono">{referrerInfo.referralCode}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
            />

            <Input
              label="Username (optional)"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              error={errors.username}
              helperText="Choose a unique username for your profile"
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              error={errors.password}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            disabled={loading}
          >
            Create Account
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
