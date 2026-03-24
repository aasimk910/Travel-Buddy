import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthHeader from "../components/AuthHeader";
import StatusAlert from "../components/StatusAlert";
import { resetPassword } from "../services/auth";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid reset link.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <AuthHeader
        title="Set a new password"
        subtitle="Choose a strong password for your account."
      />

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-8 px-4 shadow rounded-lg sm:px-10">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-green-500/20 border border-green-400/30">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-lg">Password reset!</h3>
              <p className="text-gray-300 text-sm">
                Your password has been updated. Redirecting you to sign in…
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 text-sm font-medium text-white hover:text-gray-200 underline"
              >
                Go to Sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <StatusAlert message={error} />

              {/* New password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  New password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 glass-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white sm:text-sm text-white placeholder-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">At least 6 characters</p>
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-white">
                  Confirm new password
                </label>
                <div className="mt-1">
                  <input
                    id="confirm"
                    name="confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
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
                  {loading ? "Resetting..." : "Reset password"}
                </button>
              </div>

              <p className="text-center text-sm text-gray-300">
                <Link to="/login" className="font-medium text-white hover:text-gray-200">
                  Back to Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
