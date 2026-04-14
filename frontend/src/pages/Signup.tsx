// src/pages/Signup.tsx
// #region Imports
import React, { useEffect, useState, useRef } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Map } from "lucide-react";
import { GOOGLE_CLIENT_ID, VITE_RECAPTCHA_SITE_KEY } from "../config/env";
import ReCAPTCHA from "react-google-recaptcha";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import StatusAlert from "../components/common/StatusAlert";
import { signup as signupRequest, googleAuth, storeToken } from "../services/auth";
import { getSiteStats, type SiteStats } from "../services/hikes";
import { getReviews } from "../services/reviews";

// #endregion Imports

// #region Types
type SignupFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  travelStyle: string;
  budgetRange: string;
  interests: string;
};


type LocationState = {
  from?: string;
};
// #endregion Types

// #region Component
const Signup: React.FC = () => {
  const revealRef = useScrollReveal();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from || "/homepage";
  const { loginWithProfile, isAuthenticated } = useAuth();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [avgRating, setAvgRating] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  useEffect(() => {
    getSiteStats().then(setSiteStats).catch(() => {});
    getReviews().then(reviews => {
      if (reviews.length > 0) {
        const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
        setAvgRating(avg.toFixed(1));
      }
    }).catch(() => {});
  }, []);

  // ---------- Formik setup ----------
  const {
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    touched,
    errors,
    isSubmitting,
    setStatus,
    status,
  } = useFormik<SignupFormValues>({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      country: "",
      travelStyle: "",
      budgetRange: "",
      interests: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().min(1, "Name cannot be empty or spaces only").required("Name is required"),
      email: Yup.string()
        .email("Enter a valid email")
        .test("valid-tld", "Invalid email domain. Did you mean .com?", (value) => {
          if (!value) return true;
          const tld = value.split(".").pop()?.toLowerCase() ?? "";
          const invalidTlds = ["con", "cmo", "ocm", "vom", "coom", "ney", "rog", "ogr"];
          return !invalidTlds.includes(tld);
        })
        .required("Email is required"),
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Please confirm your password"),
      country: Yup.string(),
      travelStyle: Yup.string(),
      budgetRange: Yup.string(),
      interests: Yup.string(),
    }),
        onSubmit: async (formValues, { setSubmitting, setStatus }) => {
      if (VITE_RECAPTCHA_SITE_KEY && !recaptchaToken) {
        setStatus("Please complete the reCAPTCHA.");
        return;
      }
      setStatus(undefined);
      try {
                const data = await signupRequest({
          recaptchaToken,
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          country: formValues.country || undefined,
          travelStyle: formValues.travelStyle || undefined,
          budgetRange: formValues.budgetRange || undefined,
          interests: formValues.interests || undefined,
        });

        // Auto-login: store token and set user state
        if (data.token) {
          storeToken(data.token);
        }
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
          navigate(redirectPath, { replace: true });
        } else {
          setStatus("Account created successfully! Please log in to continue.");
          setTimeout(() => navigate("/login", { replace: true }), 1500);
        }
      } catch (err: any) {
        console.error(err);
        setStatus(err?.message || "Signup failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ---------- Google signup (calls backend & saves to DB) ----------
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

      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      console.error("Google signup error:", err);
      setStatus(err?.message || "Google signup failed. Please try again.");
    }
  };

  useEffect(() => {}, []);

  // ---------- UI ----------
  return (
    <div className="min-h-screen flex bg-[#0B0F0C]" ref={revealRef}>

      {/* Left panel — cinematic nature image (desktop only) */}
      <div className="hidden lg:flex lg:w-[38%] xl:w-[42%] relative flex-col justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&cs=tinysrgb&w=1200')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0B0F0C]/90 via-[#0B0F0C]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C] via-[#0B0F0C]/30 to-transparent" />

        <div className="relative px-10 pb-12 z-10">
          {/* Stats */}
          <div className="flex gap-4 mb-8">
            {[
              { value: siteStats ? `${siteStats.userCount.toLocaleString()}+` : '—', label: 'Hikers' },
              { value: siteStats ? `${siteStats.hikeCount}+` : '—', label: 'Trails' },
              { value: avgRating ? `${avgRating}\u2605` : '—', label: 'Rating' },
            ].map((s, i) => (
              <div key={i} className="bg-[#161D19]/70 border border-white/10 rounded-xl px-4 py-3 text-center">
                <p className="text-[#C6A16E] font-bold text-xl font-heading">{s.value}</p>
                <p className="text-[#8E8A81] text-[10px] uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-gradient-to-r from-[#C6A16E]/40 to-transparent mb-8" />

          <div className="mb-3">
            <span className="section-label">Join the Community</span>
          </div>
          <blockquote className="font-heading text-2xl text-[#F5F3EE] leading-snug italic mb-3">
            “Not all those who wander are lost.”
          </blockquote>
          <p className="text-[#8E8A81] text-sm">— J.R.R. Tolkien</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center py-8 px-6 sm:px-10 lg:px-16 xl:px-20 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl">

          {/* Logo + heading */}
          <div className="mb-6 reveal reveal-fade">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-lg bg-[#1E2820] border border-[#C6A16E]/25">
                <Map className="w-5 h-5 text-[#C6A16E]" />
              </div>
              <span className="text-xl font-semibold text-[#F5F3EE] font-heading tracking-wide">Travel Buddy</span>
            </div>
            <h1 className="text-3xl font-bold text-[#F5F3EE] font-heading mb-2">Create your account</h1>
            <p className="text-[#8E8A81] text-sm">Start planning smarter trips with people who match your vibe.</p>
          </div>

          {/* Form card */}
          <div className="site-card rounded-2xl overflow-hidden reveal reveal-scale delay-100">
            <div className="h-1 w-full bg-gradient-to-r from-[#8FA68E]/60 via-[#8FA68E]/30 to-transparent" />
            <div className="px-6 py-6 sm:px-8">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <StatusAlert message={status} />

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[#B8B4AA]"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Madhav Lamichhane"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 site-input rounded-md sm:text-sm ${
                    touched.name && errors.name
                      ? "border-red-300"
                      : ""
                  }`}
                />
                {touched.name && errors.name && (
                  <p className="mt-1 text-xs text-red-300">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#B8B4AA]"
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
                  className={`mt-1 block w-full px-3 py-2 site-input rounded-md sm:text-sm ${
                    touched.email && errors.email
                      ? "border-red-300"
                      : ""
                  }`}
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-300">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#B8B4AA]"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 site-input rounded-md sm:text-sm ${
                    touched.password && errors.password
                      ? "border-red-300"
                      : ""
                  }`}
                />
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-300">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[#B8B4AA]"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-type your password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 site-input rounded-md sm:text-sm ${
                    touched.confirmPassword && errors.confirmPassword
                      ? "border-red-300"
                      : ""
                  }`}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-300">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Optional profile fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-[#B8B4AA]"
                >
                  Home country (optional)
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  placeholder="Nepal"
                  value={values.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 site-input rounded-md sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="travelStyle"
                  className="block text-sm font-medium text-[#B8B4AA]"
                >
                  Travel style (optional)
                </label>
                <select
                  id="travelStyle"
                  name="travelStyle"
                  value={values.travelStyle}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2.5 site-input rounded-md sm:text-sm [color-scheme:dark]"
                >
                  <option value="" className="bg-[#161D19]">Select a style</option>
                  <option value="budget" className="bg-[#161D19]">Budget backpacker</option>
                  <option value="comfort" className="bg-[#161D19]">Comfort / mid-range</option>
                  <option value="luxury" className="bg-[#161D19]">Luxury</option>
                  <option value="adventure" className="bg-[#161D19]">Adventure / outdoors</option>
                  <option value="slow" className="bg-[#161D19]">Slow travel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="budgetRange"
                  className="block text-sm font-medium text-[#B8B4AA]"
                >
                  Budget per day in NPR (optional)
                </label>
                <select
                  id="budgetRange"
                  name="budgetRange"
                  value={values.budgetRange}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2.5 site-input rounded-md sm:text-sm [color-scheme:dark]"
                >
                  <option value="" className="bg-[#161D19]">Choose a range</option>
                  <option value="<3000" className="bg-[#161D19]">&lt; NPR 3,000</option>
                  <option value="3000-6000" className="bg-[#161D19]">NPR 3,000–6,000</option>
                  <option value="6000-10000" className="bg-[#161D19]">NPR 6,000–10,000</option>
                  <option value="10000-15000" className="bg-[#161D19]">NPR 10,000–15,000</option>
                  <option value=">15000" className="bg-[#161D19]">&gt; NPR 15,000</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="interests"
                  className="block text-sm font-medium text-[#B8B4AA]"
                >
                  Top interests (optional)
                </label>
                <input
                  id="interests"
                  name="interests"
                  type="text"
                  placeholder="Food, hiking, museums..."
                  value={values.interests}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 site-input rounded-md sm:text-sm"
                />
              </div>
            </div>


            {/* Recaptcha */}
            {VITE_RECAPTCHA_SITE_KEY && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
                  onExpired={() => setRecaptchaToken(null)}
                />
              </div>
            )}

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || !recaptchaToken}
                className="btn-primary w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#C6A16E]/40 focus:ring-offset-0 disabled:opacity-70"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          {/* Google button at bottom � matched to Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#161D19] text-[#8E8A81]">
                  Or continue with Google
                </span>
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <GoogleAuthButton
                onCredential={(cred) => handleGoogleResponse(cred)}
                clientId={GOOGLE_CLIENT_ID}
                renderOptions={{ theme: "outline", size: "large", type: "standard", text: "continue_with", width: "100%" }}
                className="w-full max-w-xs"
              />
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-[#8E8A81]">
            Already have an account?{" "}
            <Link
              to="/login"
              state={{ from: redirectPath }}
              className="font-medium text-[#C6A16E] hover:text-[#D4AE7A] transition-colors"
            >
              Sign in
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
export default Signup;
// #endregion Exports
