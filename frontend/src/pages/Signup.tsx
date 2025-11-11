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

const GOOGLE_CLIENT_ID =
  "253733992578-35p1b3ot8cg3nqb6roimesugqlv2oh7c.apps.googleusercontent.com";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithProfile } = useAuth();
  const googleSignupButtonRef = useRef<HTMLDivElement | null>(null);

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

      // Google signup → go to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Google signup failed:", error);
    }
  };

  useEffect(() => {
    const google = (window as any).google;
    if (!google || !googleSignupButtonRef.current || !GOOGLE_CLIENT_ID) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    google.accounts.id.renderButton(googleSignupButtonRef.current, {
      theme: "outline",
      size: "large",
      width: "100%",
      type: "standard",
      text: "continue_with",
    });
  }, []);

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
        // Pretend signup is successful and send user to login
        loginWithProfile({
          name: formValues.name,
          email: formValues.email,
          country: formValues.country || undefined,
          travelStyle: formValues.travelStyle || undefined,
          budgetRange: formValues.budgetRange || undefined,
          interests: formValues.interests || undefined,
          provider: "password",
        });

        setStatus("Account created! You can now sign in.");
        // ✅ Create account → go to login
        navigate("/login");
      } catch (err) {
        console.error(err);
        setStatus("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo & Heading */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Map className="h-9 w-9 text-gray-900" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
          Create your Travel Buddy account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tell us a bit about how you like to travel so we can personalize trips
          for you.
        </p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-xl sm:px-10 border border-gray-100">
          {status && (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              {status}
            </div>
          )}

          {/* Email/password form */}
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
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
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
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
                  <p className="text-xs text-red-600 mt-1">
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
                  <p className="text-xs text-red-600 mt-1">
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
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm"
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
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm"
                >
                  <option value="">Select one</option>
                  <option value="budget">Budget backpacker</option>
                  <option value="comfort">Comfort / mid-range</option>
                  <option value="luxury">Luxury</option>
                  <option value="adventure">Adventure & hiking</option>
                  <option value="city">City explorer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="budgetRange"
                  className="block text-sm font-medium text-gray-700"
                >
                  Budget per trip (optional)
                </label>
                <select
                  id="budgetRange"
                  name="budgetRange"
                  value={values.budgetRange}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm"
                >
                  <option value="">Select range</option>
                  <option value="<$500">Under $500</option>
                  <option value="$500-$1000">$500 – $1,000</option>
                  <option value="$1000-$2500">$1,000 – $2,500</option>
                  <option value=">$2500">Over $2,500</option>
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
                  placeholder="Beaches, mountains, nightlife..."
                  value={values.interests}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm"
                />
              </div>
            </div>

            {/* Submit + link */}
            <div className="space-y-3">
              {/* ✅ Create account → goes to login via navigate("/login") in onSubmit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70"
              >
                {isSubmitting ? "Creating your account..." : "Create account"}
              </button>

              {/* ✅ Already have an account → direct Link to /login */}
              <p className="text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-gray-900 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          {/* Divider + Google button at the bottom */}
          <div className="mt-6">
            <div className="flex items-center mb-4">
              <div className="w-full border-t border-gray-200" />
              <span className="px-3 text-xs uppercase tracking-wider text-gray-400">
                or continue with Google
              </span>
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="flex justify-center">
              <div ref={googleSignupButtonRef} />
            </div>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-gray-500 text-center">
          By creating an account, you agree to Travel Buddy’s Terms &amp; Privacy
          Policy.
        </p>
      </div>
    </div>
  );
};

export default Signup;
