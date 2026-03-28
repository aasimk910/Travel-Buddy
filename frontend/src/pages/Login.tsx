// src/pages/Login.tsx
import React, { useEffect } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFormik } from "formik";
import * as Yup from "yup";
import { GOOGLE_CLIENT_ID } from "../config/env";
import GoogleAuthButton from "../components/GoogleAuthButton";
import AuthHeader from "../components/AuthHeader";
import StatusAlert from "../components/StatusAlert";
import { login as loginRequest, googleAuth, storeToken } from "../services/auth";


interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

type LocationState = {
  from?: string;
};

const Login: React.FC = () => {
  const revealRef = useScrollReveal();
  const { loginWithProfile, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from || "/homepage";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? "/admin" : redirectPath, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, redirectPath]);

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
        const data = await loginRequest({
          email: values.email,
          password: values.password,
        });

        storeToken(data.token);

        if (data.user) {
          loginWithProfile({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            country: data.user.country,
            travelStyle: data.user.travelStyle,
            budgetRange: data.user.budgetRange,
            interests: data.user.interests,
            avatarUrl: data.user.avatarUrl,
            provider: data.user.provider || "password",
            role: data.user.role || "user",
            onboardingCompleted: data.user.onboardingCompleted,
            hikingProfile: data.user.hikingProfile,
          });
        }

        if (values.remember) {
          localStorage.setItem("travelBuddyRememberEmail", values.email);
        } else {
          localStorage.removeItem("travelBuddyRememberEmail");
        }

        const destination = data.user?.role === "admin" ? "/admin" : redirectPath;
        navigate(destination, { replace: true });
      } catch (err: any) {
        console.error(err);
        setStatus(err?.message || "Login failed. Please try again.");
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
      const credential = response.credential || response; // support component callback
      if (!credential) return;

      const data = await googleAuth(credential);

      storeToken(data.token);

      if (data.user) {
        loginWithProfile({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          country: data.user.country,
          travelStyle: data.user.travelStyle,
          budgetRange: data.user.budgetRange,
          interests: data.user.interests,
          avatarUrl: data.user.avatarUrl,
          provider: data.user.provider || "google",
          role: data.user.role || "user",
          onboardingCompleted: data.user.onboardingCompleted,
          hikingProfile: data.user.hikingProfile,
        });
      }

      const destination = data.user?.role === "admin" ? "/admin" : redirectPath;
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error(err);
      formik.setStatus(err?.message || "Google login failed. Please try again.");
    }
  };

  useEffect(() => {}, []);

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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" ref={revealRef}>
      <div className="reveal reveal-fade">
        <AuthHeader
          title="Sign in to your account"
          subtitle="Access your trips, matches, and saved destinations."
        />
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md reveal reveal-scale delay-100">
        <div className="glass-card py-8 px-4 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <StatusAlert message={status} />

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white"
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
                  className={`block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300 ${
                    touched.email && errors.email
                      ? "border-red-300"
                      : ""
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-300">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white"
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
                  className={`block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300 ${
                    touched.password && errors.password
                      ? "border-red-300"
                      : ""
                  }`}
                />
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-red-300">{errors.password}</p>
              )}
            </div>

            {/* Remember me / Forgot password */}
              <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={values.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-white/30 text-white focus:ring-white glass"
                />
                <span>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-white hover:text-gray-200"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-md glass-button-dark py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* Divider + Google button at bottom (matches Signup) */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="glass-strong px-2 text-gray-300">
                  Or continue with Google
                </span>
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <GoogleAuthButton
                onCredential={(cred) => handleGoogleResponse(cred)}
                clientId={GOOGLE_CLIENT_ID}
                renderOptions={{ theme: "outline", size: "large", type: "standard", text: "continue_with" }}
                className="w-full max-w-xs"
              />
            </div>
          </div>

          {/* Link to signup */}
          <p className="mt-6 text-center text-sm text-gray-200">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              state={{ from: redirectPath }}
              className="font-medium text-white hover:text-gray-200"
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
