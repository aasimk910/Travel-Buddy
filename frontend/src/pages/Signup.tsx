// src/pages/Signup.tsx
import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const API_BASE_URL = "http://localhost:5000";

const GOOGLE_CLIENT_ID =
  "253733992578-35p1b3ot8cg3nqb6roimesugqlv2oh7c.apps.googleusercontent.com";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithProfile } = useAuth();
  const googleSignupButtonRef = useRef<HTMLDivElement | null>(null);

  // ---------- Google signup ----------
  const handleGoogleResponse = (response: any) => {
    try {
      const credential = response.credential;
      if (!credential) return;

      const payload = JSON.parse(
        atob(credential.split(".")[1])
      ) as {
        name?: string;
        email?: string;
        picture?: string;
      };

      if (!payload.email) return;

      loginWithProfile({
        name: payload.name || "Traveler",
        email: payload.email,
        avatarUrl: payload.picture,
        provider: "google",
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("Google signup error:", err);
    }
  };

  useEffect(() => {
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
        text: "signup_with",
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

  // ---------- Email/password signup (backend) ----------
  const {
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    errors,
    touched,
    isSubmitting,
    status,
    setStatus,
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
      name: Yup.string()
        .min(2, "Name is too short.")
        .required("Please enter your name."),
      email: Yup.string()
        .email("Enter a valid email address.")
        .required("Please enter your email."),
      password: Yup.string()
        .min(6, "Password should be at least 6 characters.")
        .required("Please create a password."),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords do not match.")
        .required("Please confirm your password."),
      country: Yup.string(),
      travelStyle: Yup.string(),
      budgetRange: Yup.string(),
      interests: Yup.string(),
    }),
    onSubmit: async (formValues, { setSubmitting }) => {
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

        // Keep same UX as before: show message & send to login
        setStatus("Account created! You can now sign in.");
        navigate("/login");
      } catch (err) {
        console.error(err);
        setStatus("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ---------- UI (same centered card style) ----------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo & Heading */}
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
          Create your Travel Buddy account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Set up your profile and start connecting with other travelers.
        </p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {status && (
              <div
                className={`rounded-md px-3 py-2 text-xs ${
                  status.toLowerCase().includes("created")
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                    : "bg-red-50 border border-red-100 text-red-700"
                }`}
              >
                {status}
              </div>
            )}

            {/* Name + Email */}
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
                  placeholder="Rosy Traveler"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm ${
                    touched.name && errors.name
                      ? "border-red-400"
                      : "border-gray-300"
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
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm ${
                    touched.email && errors.email
                      ? "border-red-400"
                      : "border-gray-300"
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
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm ${
                    touched.password && errors.password
                      ? "border-red-400"
                      : "border-gray-300"
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
                  placeholder="••••••••"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm ${
                    touched.confirmPassword && errors.confirmPassword
                      ? "border-red-400"
                      : "border-gray-300"
                  }`}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Travel profile fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700"
                >
                  Country (optional)
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  placeholder="United States"
                  value={values.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm border-gray-300"
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
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm border-gray-300"
                >
                  <option value="">Select style</option>
                  <option value="backpacker">Backpacker</option>
                  <option value="luxury">Luxury</option>
                  <option value="digital_nomad">Digital nomad</option>
                  <option value="weekend_getaways">Weekend getaways</option>
                  <option value="road_trips">Road trips</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="budgetRange"
                  className="block text-sm font-medium text-gray-700"
                >
                  Budget range (optional)
                </label>
                <select
                  id="budgetRange"
                  name="budgetRange"
                  value={values.budgetRange}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm border-gray-300"
                >
                  <option value="">Select budget</option>
                  <option value="low">Budget-friendly</option>
                  <option value="medium">Comfort</option>
                  <option value="high">High-end</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="interests"
                  className="block text-sm font-medium text-gray-700"
                >
                  Interests (optional)
                </label>
                <input
                  id="interests"
                  name="interests"
                  type="text"
                  placeholder="Food, hiking, museums..."
                  value={values.interests}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm border-gray-300"
                />
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-md border border-transparent bg-gray-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-60"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          {/* Divider + Google */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400">
                  or sign up with
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div ref={googleSignupButtonRef} />
            </div>
          </div>

          {/* Link to login */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-gray-900 hover:text-black"
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
