"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker.css";
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
import Select from "@/components/Select";
import { createReferralAction } from '@/app/actions/referral';
import { CircleIcon } from "@/components/circle";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user, loading: authLoading } = useAuth();

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    sex: "" as "" | "male" | "female" | "other",
    dateOfBirth: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = React.useState(false);
  const [referralCode, setReferralCode] = React.useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = React.useState<{
    username?: string;
    referralCode: string;
  } | null>(null);

  // Check for source parameter
  const userType = React.useMemo(() => {
    const source = searchParams.get('source');
    const determinedUserType = source === 'corporate' ? 'corporate' : 'regular';
    return determinedUserType;
  }, [searchParams]);

  // Check for referral code on page load
  React.useEffect(() => {
    const checkReferralCode = async () => {
      // Check URL parameters first
      const refParam = searchParams.get("ref");
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

  // Redirect if already authenticated (but not when showing verification alert)
  React.useEffect(() => {
    if (user && !authLoading && !showVerificationAlert) {
      router.push("/dashboard");
    }
  }, [user, authLoading, showVerificationAlert, router]);



  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

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
      console.log(formData,"formData");
      // --- CONTINUE WITH SIGNUP ---
      const result = await signUp(
        formData.email,
        formData.password,
        formData.username,
        userType,
        (formData.sex || undefined) as "male" | "female" | "other" | undefined,
        formData.dateOfBirth || undefined
      );
      if (result.success) {
        // --- CREATE REFERRAL RECORD IF REFERRAL CODE PRESENT ---
        const referrerId = localStorage.getItem("referrer_id");
        if (referralCode && referrerId && result?.user?.id) {
          try {
            // Get referrer's user type
            const referrer = await UserService.getUserById(referrerId);
            if (!referrer) {
              console.error("[Signup] Referrer not found:", referrerId);
              return;
            }

            // Create referral record using server action
            const referralResult = await createReferralAction({
              referrerId: referrerId,
              referredEmail: formData.email,
              referredUserId: result.user.id,
              userAgent: navigator.userAgent,
              userType: referrer.user_type, // Use referrer's user type
            });
            
            if (!referralResult.success) {
              if (referralResult.throttled) {
                console.warn("[Signup] Referral creation throttled:", referralResult.error);
                // Don't show error to user for throttling - just log it
              } else {
                console.error("[Signup] Failed to create referral:", referralResult.error);
                // Could show a non-blocking error message here if needed
              }
            } else {
              console.log("[Signup] Created referral record for:", formData.email, "with referrer type:", referrer.user_type);
            }
            
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
        // Show verification alert instead of redirecting immediately
        setShowVerificationAlert(true);
        // Clear any previous errors
        setErrors({});
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

  // Only show loading if auth is still initializing and user is not authenticated
  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Section (60%) */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full h-full">
          <a href={process.env.NEXT_PUBLIC_LANDING_PAGE_URL}>
            <Image
              src="/GreenLogo.svg"
              alt="Logo"
              width={120}
              height={120}
              className="mb-6"
            />
          </a>
          <h1 className="text-4xl font-bold mb-4 text-center">
            Join the Waitlist
          </h1>
          <p className="text-xl text-center mb-8 opacity-90 max-w-md">
            Create your account and start building your referral network today
          </p>
          <div className="flex items-center space-x-4 text-sm opacity-75">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Earn Rewards</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span>Grow Together</span>
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
              src="/GreenLogo.svg"
              alt="Logo"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Account
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Join our community and start earning rewards
            </p>
          </div>

          {/* Email Verification Alert */}
          {showVerificationAlert && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">✓</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Account created successfully!
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    A verification email has been sent to <strong>{formData.email}</strong>. Please check your inbox and click the verification link to complete your registration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Referral Banner */}
          {referrerInfo && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">👋</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    You were invited by {referrerInfo.username || "a friend"}!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Referral code:{" "}
                    <span className="font-mono">{referrerInfo.referralCode}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showVerificationAlert ? (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-6">
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

                {/* Sex and Date of Birth Row */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-2/6 min-w-28">

                  <Select
                    id="sex"
                    label="Sex (optional)"
                    value={formData.sex}
                    onChange={(e) => handleInputChange("sex", e.target.value)}
                    options={[
                      { value: "", label: "Select..." },
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                    />
                    </div>

                  <div className="w-full">
                    <label
                      htmlFor="dateOfBirth"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Date of Birth (optional)
                    </label>
                    <div className="mt-1">
                      <DatePicker
                        id="dateOfBirth"
                        selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                        onChange={(date: Date | null) => 
                          handleInputChange("dateOfBirth", date ? date.toISOString().split('T')[0] : '')
                        }
                        dateFormat="MMMM d, yyyy"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        placeholderText="Select date"
                        maxDate={new Date()}
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                        calendarClassName="dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>
                </div>

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
                Create Account
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Already have an account?{" "}
                  <Link
                    href="/signin"
                    className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Once you&apos;ve verified your email, you can sign in to access your dashboard.
                </p>
                <Link href="/signin">
                  <Button variant="primary" className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
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
