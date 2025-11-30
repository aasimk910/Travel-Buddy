// src/pages/Signup.tsx
import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Map } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFormik } from "formik";
import * as Yup from "yup";

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

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000";

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";

if (!(import.meta as any).env?.VITE_API_BASE_URL) {
  console.warn(
    "VITE_API_BASE_URL is not set. Falling back to http://localhost:5000"
  );
}

if (!GOOGLE_CLIENT_ID) {
  console.warn("VITE_GOOGLE_CLIENT_ID is not set. Google signup is disabled.");
}

type LocationState = {
  from?: string;
};

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from || "/homepage";
  const { loginWithProfile, isAuthenticated } = useAuth();
  const googleSignupButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

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
      name: Yup.string().required("Name is required"),
      email: Yup.string()
        .email("Enter a valid email")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
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
      setStatus(undefined);
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formValues.name,
            email: formValues.email,
            password: formValues.password,
            country: formValues.country || undefined,
            travelStyle: formValues.travelStyle || undefined,
            budgetRange: formValues.budgetRange || undefined,
            interests: formValues.interests || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus(data.message || "Signup failed. Please try again.");
          return;
        }

        // ✅ store JWT token if provided
        if (data.token) {
          localStorage.setItem("travelBuddyToken", data.token);
        }

        // ✅ save user in AuthContext so they are logged in immediately
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

        setStatus("Account created! Redirecting...");
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error(err);
        setStatus("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ---------- Google signup (calls backend & saves to DB) ----------
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
        setStatus(data.message || "Google signup failed. Please try again.");
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

      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Google signup error:", err);
      setStatus("Google signup failed. Please try again.");
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      const w = window as any;
      if (!w.google || !googleSignupButtonRef.current) return;

      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      w.google.accounts.id.renderButton(googleSignupButtonRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
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

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo & Heading */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2">
          <div className="bg-black text-white p-2 rounded-lg shadow-sm">
            <Map className="w-5 h-5" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-black">
            Travel Buddy
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-black">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Start planning smarter trips with people who match your vibe.
        </p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg sm:px-10 border border-black">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Status alert */}
            {status && (
              <div className="rounded-md bg-white border border-black px-4 py-2 text-sm text-black">
                {status}
              </div>
            )}

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
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
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black sm:text-sm ${
                    touched.name && errors.name
                      ? "border-black"
                      : "border-black"
                  }`}
                />
                {touched.name && errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
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
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black sm:text-sm ${
                    touched.email && errors.email
                      ? "border-black"
                      : "border-black"
                  }`}
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
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
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black sm:text-sm ${
                    touched.password && errors.password
                      ? "border-black"
                      : "border-black"
                  }`}
                />
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
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
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black sm:text-sm ${
                    touched.confirmPassword && errors.confirmPassword
                      ? "border-red-400"
                      : "border-black"
                  }`}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
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
                  className="block text-sm font-medium text-gray-700"
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
                  className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="travelStyle"
                  className="block text-sm font-medium text-gray-700"
                >
                  Travel style (optional)
                </label>
                <select
                  id="travelStyle"
                  name="travelStyle"
                  value={values.travelStyle}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black sm:text-sm bg-white"
                >
                  <option value="">Select a style</option>
                  <option value="budget">Budget backpacker</option>
                  <option value="comfort">Comfort / mid-range</option>
                  <option value="luxury">Luxury</option>
                  <option value="adventure">Adventure / outdoors</option>
                  <option value="slow">Slow travel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="budgetRange"
                  className="block text-sm font-medium text-gray-700"
                >
                  Budget per day (optional)
                </label>
                <select
                  id="budgetRange"
                  name="budgetRange"
                  value={values.budgetRange}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black sm:text-sm bg-white"
                >
                  <option value="">Choose a range</option>
                  <option value="<30">&lt; $30</option>
                  <option value="30-60">$30–60</option>
                  <option value="60-100">$60–100</option>
                  <option value="100-150">$100–150</option>
                  <option value=">150">&gt; $150</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="interests"
                  className="block text-sm font-medium text-gray-700"
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
                  className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-70"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          {/* Google button at bottom — matched to Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-400">
                  Or continue with Google
                </span>
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <div
                ref={googleSignupButtonRef}
                className="w-full max-w-xs"
              />
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              state={{ from: redirectPath }}
              className="font-medium text-black hover:text-black"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
