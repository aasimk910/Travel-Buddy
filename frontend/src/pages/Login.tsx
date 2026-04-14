// src/pages/Login.tsx
// #region Imports
import React, { useEffect } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Map } from "lucide-react";
import { GOOGLE_CLIENT_ID } from "../config/env";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import StatusAlert from "../components/common/StatusAlert";
import { login as loginRequest, googleAuth, storeToken } from "../services/auth";


// #endregion Imports

// #region Types
interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

type LocationState = {
  from?: string;
};
// #endregion Types

// #region Component
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
        .test("valid-tld", "Invalid email domain. Did you mean .com?", (value) => {
          if (!value) return true;
          const tld = value.split(".").pop()?.toLowerCase() ?? "";
          const invalidTlds = ["con", "cmo", "ocm", "vom", "coom", "ney", "rog", "ogr"];
          return !invalidTlds.includes(tld);
        })
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

        // Store token in localStorage (persist) or sessionStorage (session-only) based on remember-me
        storeToken(data.token, values.remember);

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

      // Respect the current remember-me checkbox for Google login too
      storeToken(data.token, values.remember);

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
    <div className="min-h-screen flex bg-[#0B0F0C]" ref={revealRef}>

      {/* Left panel — cinematic nature image (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative flex-col justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1200')" }}
        />
        {/* Multi-layer atmospheric overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0B0F0C]/90 via-[#0B0F0C]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C] via-[#0B0F0C]/30 to-transparent" />

        <div className="relative px-10 pb-12 z-10">
          {/* Feature list */}
          <div className="mb-8 space-y-3">
            {[
              { icon: '\uD83C\uDFD4\uFE0F', text: 'Discover hikes across Nepal' },
              { icon: '\uD83D\uDC65', text: 'Connect with fellow adventurers' },
              { icon: '\uD83D\uDDFA\uFE0F', text: 'Plan and track expenses together' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C6A16E]/15 border border-[#C6A16E]/25 flex items-center justify-center text-sm shrink-0">
                  {f.icon}
                </div>
                <span className="text-[#B8B4AA] text-sm">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-gradient-to-r from-[#C6A16E]/40 to-transparent mb-8" />

          <div className="mb-3">
            <span className="section-label">Travel Buddy</span>
          </div>
          <blockquote className="font-heading text-2xl xl:text-3xl text-[#F5F3EE] leading-snug italic mb-3">
            “The world is a book, and those who do not travel read only one page.”
          </blockquote>
          <p className="text-[#8E8A81] text-sm">— Saint Augustine</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center py-10 px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto w-full max-w-md">

          {/* Logo + heading */}
          <div className="mb-8 reveal reveal-fade">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-lg bg-[#1E2820] border border-[#C6A16E]/25">
                <Map className="w-5 h-5 text-[#C6A16E]" />
              </div>
              <span className="text-xl font-semibold text-[#F5F3EE] font-heading tracking-wide">Travel Buddy</span>
            </div>
            <h1 className="text-3xl font-bold text-[#F5F3EE] font-heading mb-2">Welcome back</h1>
            <p className="text-[#8E8A81] text-sm">Sign in to access your trips and adventures.</p>
          </div>

          {/* Form card */}
          <div className="site-card rounded-2xl overflow-hidden reveal reveal-scale delay-100">
            <div className="h-1 w-full bg-gradient-to-r from-[#C6A16E]/70 via-[#E8D5B0]/40 to-transparent" />
            <div className="px-6 py-7 sm:px-8">

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <StatusAlert message={status} />

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-[#8E8A81]">
                    Email address
                  </label>
                  <input
                    id="email" name="email" type="email" autoComplete="email"
                    placeholder="you@example.com"
                    value={values.email} onChange={handleChange} onBlur={handleBlur}
                    className={`block w-full px-4 py-3 site-input rounded-xl text-sm ${
                      touched.email && errors.email ? "border-red-700/50" : ""
                    }`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-xs text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-[#8E8A81]">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-[#C6A16E] hover:text-[#D4AE7A] transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password" name="password" type="password" autoComplete="current-password"
                    placeholder="••••••••"
                    value={values.password} onChange={handleChange} onBlur={handleBlur}
                    className={`block w-full px-4 py-3 site-input rounded-xl text-sm ${
                      touched.password && errors.password ? "border-red-700/50" : ""
                    }`}
                  />
                  {touched.password && errors.password && (
                    <p className="text-xs text-red-400">{errors.password}</p>
                  )}
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2.5 text-sm text-[#B8B4AA] cursor-pointer">
                  <input
                    id="remember" name="remember" type="checkbox"
                    checked={values.remember} onChange={handleChange}
                    className="h-4 w-4 rounded border-white/20 bg-[#161D19] text-[#C6A16E] focus:ring-[#C6A16E]/30 focus:ring-offset-0"
                  />
                  <span>Remember me</span>
                </label>

                {/* Submit */}
                <button
                  type="submit" disabled={isSubmitting}
                  className="btn-primary flex w-full justify-center rounded-xl py-3 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#C6A16E]/40 focus:ring-offset-0 disabled:opacity-60"
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs text-[#8E8A81]">or continue with</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              <div className="flex justify-center">
                <GoogleAuthButton
                  onCredential={(cred) => handleGoogleResponse(cred)}
                  clientId={GOOGLE_CLIENT_ID}
                  renderOptions={{ theme: "outline", size: "large", type: "standard", text: "continue_with" }}
                  className="w-full max-w-xs"
                />
              </div>

              <p className="mt-5 text-center text-sm text-[#8E8A81]">
                Don&apos;t have an account?{" "}
                <Link to="/signup" state={{ from: redirectPath }}
                  className="font-medium text-[#C6A16E] hover:text-[#D4AE7A] transition-colors">
                  Create one free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default Login;
// #endregion Exports
