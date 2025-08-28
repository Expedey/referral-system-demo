import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { CircleIcon } from "@/components/circle";
import { login } from "@/utils/supabase/actions";

export default function SigninPage() {
  // const { signIn, user, loading: authLoading } = useAuth();

  // const [formData, setFormData] = useState({
  //   email: "",
  //   password: "",
  // });
  // const [errors, setErrors] = useState<Record<string, string>>({});
  // const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  // useEffect(() => {
  //   if (user && !authLoading) {
  //     router.push("/dashboard");
  //   }
  // }, [user, authLoading, router]);

  // const validateForm = () => {
  //   const newErrors: Record<string, string> = {};

  //   // if (!formData.email) {
  //   //   newErrors.email = "Email is required";
  //   // } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
  //   //   newErrors.email = "Please enter a valid email";
  //   // }

  //   // if (!formData.password) {
  //   //   newErrors.password = "Password is required";
  //   // }

  //   // setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  // Only show loading if auth is still initializing, not during signin
  // if (authLoading && !user) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50 ">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600 ">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Section (60%) */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full h-full">
          <a href={process.env.NEXT_PUBLIC_LANDING_PAGE_URL}>
            <Image
              src="/Logo.svg"
              alt="Logo"
              width={120}
              height={120}
              className="mb-6"
            />
          </a>
          <h1 className="text-4xl font-bold mb-4 text-center">Welcome Back</h1>
          <p className="text-xl text-center mb-8 opacity-90 max-w-md">
            Sign in to your account and continue building your referral network
          </p>
          <div className="flex items-center space-x-4 text-sm opacity-75">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Secure Authentication</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span>Fast & Reliable</span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full">
          <CircleIcon fillColor="white" className="w-full h-full opacity-10" />
        </div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full">
          <CircleIcon fillColor="white" className="w-full h-full opacity-10" />
        </div>
        <div className="absolute top-1/2 left-10 w-16 h-16 rounded-full">
          <CircleIcon fillColor="white" className="w-full h-full opacity-10" />
        </div>
      </div>

      {/* Right Side - Form Section (40%) */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-8 py-12 bg-white ">
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
            <h2 className="text-3xl font-bold text-gray-900  mb-2">Sign In</h2>
            <p className="text-gray-600 ">
              Welcome back! Please enter your details
            </p>
          </div>

          <form className="space-y-8">
            <div className="space-y-6">
              <Input
                label="Email"
                type="email"
                id="email"
                name="email"
                // value={formData.email}
                // error={errors.email}
                required
                autoComplete="email"
              />

              <div className="space-y-2">
                <Input
                  label="Password"
                  type="password"
                  id="password"
                  name="password"
                  // value={formData.password}
                  // error={errors.password}
                  required
                  autoComplete="current-password"
                />

                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500  transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            {/* {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 ">{errors.submit}</p>
              </div>
            )} */}

            <Button
              type="submit"
              formAction={login}
              // loading={loading}
              className="w-full"
              // disabled={loading}
            >
              Sign In
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 ">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500  transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
