// src/pages/Login.tsx
import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFormik } from "formik";
import * as Yup from "yup";

// 🔑 Put your real Google Client ID here
const GOOGLE_CLIENT_ID = "253733992578-35p1b3ot8cg3nqb6roimesugqlv2oh7c.apps.googleusercontent.com";

// Helper to decode the JWT from Google (front-end only)
const parseJwt = (token: string): any => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
};

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  // Formik setup
  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
      remember: false,
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Please enter a valid email address.")
        .required("Please enter your email."),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters long.")
        .required("Please enter your password."),
      remember: Yup.boolean(),
    }),
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);

      try {
        // Here you could call your backend /api/auth/login
        // For now we keep using AuthContext login()
        login(values.email, values.password);

        if (values.remember) {
          localStorage.setItem("travelBuddyRememberEmail", values.email);
        } else {
          localStorage.removeItem("travelBuddyRememberEmail");
        }

        navigate("/dashboard");
      } catch (err) {
        console.error(err);
        setStatus("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const {
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    errors,
    touched,
    isSubmitting,
    status,
    setFieldValue,
  } = formik;

  // Load remembered email if stored
  useEffect(() => {
    const storedEmail = localStorage.getItem("travelBuddyRememberEmail");
    if (storedEmail) {
      setFieldValue("email", storedEmail, false);
      setFieldValue("remember", true, false);
    }
  }, [setFieldValue]);

  // Initialize Google Identity button
  useEffect(() => {
    const google = (window as any).google;
    if (!google || !googleButtonRef.current || !GOOGLE_CLIENT_ID) return;

    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          try {
            const payload = parseJwt(response.credential);
            if (!payload || !payload.email) {
              formik.setStatus("Google login failed. Please try again.");
              return;
            }

            // Save logged in Google user in AuthContext
            loginWithGoogle({
              name: payload.name || payload.given_name || "Traveler",
              email: payload.email,
              avatarUrl: payload.picture,
              provider: "google",
            });

            navigate("/dashboard");
          } catch (err) {
            console.error(err);
            formik.setStatus("Google login failed. Please try again.");
          }
        },
      });

      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: "350",
      });
    } catch (err) {
      console.error("Google init error", err);
    }
  }, [loginWithGoogle, navigate, formik]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Map className="h-9 w-9 text-gray-900" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
          Welcome back to Travel Buddy
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage your trips, buddies, and itineraries.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Global form error / status */}
            {status && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
                {status}
              </p>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 sm:text-sm ${
                  touched.email && errors.email
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-800"
                  onClick={() =>
                    alert(
                      "Forgot password flow is not connected to a real backend yet."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 sm:text-sm ${
                  touched.password && errors.password
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />
              {touched.password && errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember + link */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={values.remember}
                  onChange={handleChange}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                />
                <span className="ml-2 block text-sm text-gray-700">
                  Remember this device
                </span>
              </label>

              <div className="text-sm text-gray-600">
                New here?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-gray-900 hover:underline"
                >
                  Create an account
                </Link>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70"
              >
                {isSubmitting ? "Signing you in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* Social login section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col space-y-3">
              {/* Google button rendered by Google script */}
              <div
                ref={googleButtonRef}
                className="flex justify-center"
              ></div>
            </div>

            <p className="mt-4 text-[11px] text-gray-500 text-center">
              By continuing, you agree to Travel Buddy’s Terms &amp; Privacy
              Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
