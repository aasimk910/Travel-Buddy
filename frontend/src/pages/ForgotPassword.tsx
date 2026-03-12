import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthHeader from "../components/AuthHeader";
import StatusAlert from "../components/StatusAlert";
import { forgotPassword } from "../services/auth";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.provider === "google") {
        setIsGoogleAccount(true);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <AuthHeader
        title="Forgot your password?"
        subtitle="Enter your email and we'll send you a reset link."
      />

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-8 px-4 shadow rounded-lg sm:px-10">
          {isGoogleAccount ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-blue-500/20 border border-blue-400/30">
                <svg className="w-7 h-7 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg">Google account detected</h3>
              <p className="text-gray-300 text-sm">
                <strong>{email}</strong> is linked to Google Sign-In. You don't have a separate password — just use the <strong>Continue with Google</strong> button on the login page.
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 px-5 py-2 rounded-full glass-button-dark text-sm font-medium text-white"
              >
                Back to Sign in
              </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-green-500/20 border border-green-400/30">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg">Check your inbox</h3>
              <p className="text-gray-300 text-sm">
                If <strong>{email}</strong> is registered, you'll receive a password reset link shortly. Check your spam folder too.
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 text-sm font-medium text-white hover:text-gray-200 underline"
              >
                Back to Sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <StatusAlert message={error} />

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full px-3 py-2 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-md glass-button-dark py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </div>

              <p className="text-center text-sm text-gray-300">
                Remember your password?{" "}
                <Link to="/login" className="font-medium text-white hover:text-gray-200">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
