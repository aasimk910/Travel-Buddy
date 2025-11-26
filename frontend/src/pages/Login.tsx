// src/pages/Login.tsx
import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFormik } from "formik";
import * as Yup from "yup";

// Backend base URL
const API_BASE_URL = "http://localhost:5000";

// Your Google Client ID
const GOOGLE_CLIENT_ID =
  "253733992578-35p1b3ot8cg3nqb6roimesugqlv2oh7c.apps.googleusercontent.com";

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const { loginWithProfile } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  // ---------- Email/password Login (backend) ----------
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
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus(data.message || "Login failed. Please try again.");
          return;
        }

        if (data.token) {
          localStorage.setItem("travelBuddyToken", data.token);
        }

        if (data.user) {
          loginWithProfile({
            name: data.user.name,
            email: data.user.email,
            country: data.user.country,
            travelStyle: data.user.travelStyle,
            budgetRange: data.user.budgetRange,
            interests: data.user.interests,
            avatarUrl: data.user.avatarUrl,
            provider: data.user.provider || "password",
          });
        }

        if (values.remember) {
          localStorage.setItem("travelBuddyRememberEmail", values.email);
        } else {
          localStorage.removeItem("travelBuddyRememberEmail");
        }

        navigate("/");
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
  } = formik;

  // ---------- Google Login (hits backend & saves to DB) ----------
  const handleGoogleResponse = async (response: any) => {
    try {
      const credential = response.credential;
      if (!credential) return;

      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        formik.setStatus(
          data.message || "Google login failed. Please try again."
        );
        return;
      }

      if (data.token) {
        localStorage.setItem("travelBuddyToken", data.token);
      }

      if (data.user) {
        loginWithProfile({
          name: data.user.name,
          email: data.user.email,
          country: data.user.country,
          travelStyle: data.user.travelStyle,
          budgetRange: data.user.budgetRange,
          interests: data.user.interests,
          avatarUrl: data.user.avatarUrl,
          provider: data.user.provider || "google",
        });
      }

      navigate("/");
    } catch (err) {
      console.error(err);
      formik.setStatus("Google login failed. Please try again.");
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      const w = window as any;
      if (!w.google || !googleButtonRef.current) return;

      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      w.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "continue_with",
      });
    };

    const w = window as any;
    if (!w.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
  }, []);

  // Prefill remembered email
  useEffect(() => {
    const remembered = localStorage.getItem("travelBuddyRememberEmail");
    if (remembered) {
      formik.setFieldValue("email", remembered);
      formik.setFieldValue("remember", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo + heading */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2">
          <div className="bg-gray-900 text-white p-2 rounded-lg shadow-sm">
            <Map className="w-5 h-5" />
          </div>
          <span className="text-xl font-semibold text-gray-900">
            Travel Buddy
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your trips, matches, and saved destinations.
        </p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {status && (
              <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                {status}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm ${
                    touched.email && errors.email
                      ? "border-red-400"
                      : "border-gray-300"
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm ${
                    touched.password && errors.password
                      ? "border-red-400"
                      : "border-gray-300"
                  }`}
                />
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember me / Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={values.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="text-xs font-medium text-gray-900 hover:text-black"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-md border border-transparent bg-gray-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* Divider + Google button at bottom (matches Signup) */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400">
                  Or continue with Google
                </span>
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <div ref={googleButtonRef} className="w-full max-w-xs" />
            </div>
          </div>

          {/* Link to signup */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-gray-900 hover:text-black"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
