// src/pages/Signup.tsx
import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFormik } from "formik";
import * as Yup from "yup";
import { GOOGLE_CLIENT_ID } from "../config/env";
import GoogleAuthButton from "../components/GoogleAuthButton";
import AuthHeader from "../components/AuthHeader";
import StatusAlert from "../components/StatusAlert";
import { signup as signupRequest, googleAuth, storeToken } from "../services/auth";

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

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from || "/homepage";
  const { loginWithProfile, isAuthenticated } = useAuth();

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
        const data = await signupRequest({
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          country: formValues.country || undefined,
          travelStyle: formValues.travelStyle || undefined,
          budgetRange: formValues.budgetRange || undefined,
          interests: formValues.interests || undefined,
        });

        storeToken(data.token);

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
    } catch (err: any) {
      console.error("Google signup error:", err);
      setStatus(err?.message || "Google signup failed. Please try again.");
    }
  };

  useEffect(() => {}, []);

  // ---------- UI ----------
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <AuthHeader
        title="Create your account"
        subtitle="Start planning smarter trips with people who match your vibe."
      />

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="glass-card py-8 px-6 shadow-sm rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <StatusAlert message={status} />

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-white"
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
                  className={`mt-1 block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300 ${
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
                  className="block text-sm font-medium text-white"
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
                  className={`mt-1 block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300 ${
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
                  className="block text-sm font-medium text-white"
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
                  className={`mt-1 block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300 ${
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
                  className="block text-sm font-medium text-white"
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
                  className={`mt-1 block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300 ${
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
                  className="block text-sm font-medium text-white"
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
                  className="mt-1 block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300"
                />
              </div>

              <div>
                <label
                  htmlFor="travelStyle"
                  className="block text-sm font-medium text-white"
                >
                  Travel style (optional)
                </label>
                <select
                  id="travelStyle"
                  name="travelStyle"
                  value={values.travelStyle}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white"
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
                  className="block text-sm font-medium text-white"
                >
                  Budget per day (optional)
                </label>
                <select
                  id="budgetRange"
                  name="budgetRange"
                  value={values.budgetRange}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white"
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
                  className="block text-sm font-medium text-white"
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
                  className="mt-1 block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300"
                />
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white glass-button-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-70"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          {/* Google button at bottom — matched to Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 glass-strong text-gray-300">
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
          <p className="mt-6 text-center text-sm text-gray-200">
            Already have an account?{" "}
            <Link
              to="/login"
              state={{ from: redirectPath }}
              className="font-medium text-white hover:text-gray-200"
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
