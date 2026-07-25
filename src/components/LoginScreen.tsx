/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Mail, Lock, ArrowRight, Leaf } from "lucide-react";
import { motion } from "motion/react";
import { signInWithGoogle, signInWithEmail } from "../lib/firebase";

interface LoginScreenProps {
  onLoginSuccess: (name: string, email: string, uid?: string) => void;
  onNavigateToCreateAccount: () => void;
  onContinueAsGuest: () => void;
}

export default function LoginScreen({
  onLoginSuccess,
  onNavigateToCreateAccount,
  onContinueAsGuest,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg("");
    try {
      const user = await signInWithGoogle();
      const name = user.displayName || user.email?.split("@")[0] || "User";
      onLoginSuccess(name, user.email || "", user.uid);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in cancelled.");
      } else {
        setErrorMsg(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg("");

    try {
      const user = await signInWithEmail(email, password);
      const name = user.displayName || email.split("@")[0];
      onLoginSuccess(name, user.email || email, user.uid);
    } catch (err: any) {
      console.error(err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setErrorMsg("Invalid email or password.");
      } else {
        setErrorMsg(err.message || "Failed to sign in.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[90vh] px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full flex flex-col items-center space-y-8"
      >
        {/* Header Section */}
        <header className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 bg-primary-container text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Muslim Worship Tracker
          </h1>
          <p className="text-sm font-medium text-gray-500 max-w-[280px] mx-auto leading-relaxed">
            Sign in to continue your spiritual journey.
          </p>
        </header>

        {/* Form Canvas */}
        <section className="w-full bg-white p-6 rounded-3xl shadow-md shadow-gray-100 border border-gray-100/50 space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100">
                {errorMsg}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  className="w-full pl-12 pr-4 h-12 bg-gray-50/70 border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm placeholder:text-gray-400 text-gray-800 font-medium"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  className="w-full pl-12 pr-4 h-12 bg-gray-50/70 border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm placeholder:text-gray-400 text-gray-800 font-medium"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Extras */}
            <div className="flex items-center justify-between text-xs px-1 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                  type="checkbox"
                />
                <span className="text-gray-500 font-medium">Remember me</span>
              </label>
              <button
                type="button"
                className="text-primary font-semibold hover:underline"
                onClick={() => setErrorMsg("Reset link simulated! Please use any mock password to login.")}
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                disabled={isLoading}
                className="w-full bg-primary text-white font-bold h-12 rounded-2xl shadow-lg shadow-primary/10 transition-all active:scale-[0.98] hover:bg-primary/95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-80"
                type="submit"
              >
                {isLoading ? (
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full bg-white dark:bg-[#1e2a1e]/40 hover:bg-gray-50 border border-gray-200 dark:border-[#1e2a1e] text-gray-700 dark:text-gray-100 font-bold h-12 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center space-x-3 cursor-pointer shadow-sm disabled:opacity-80"
          >
            {isGoogleLoading ? (
              <span className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Social/Alternative Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-xs font-bold tracking-wider text-gray-400 uppercase">or sign in with email</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* Guest Button */}
          <button
            onClick={onContinueAsGuest}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold h-12 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Continue as Guest</span>
          </button>
        </section>

        {/* Footer Section */}
        <footer className="text-center space-y-2">
          <p className="text-sm font-medium text-gray-500">
            Don't have an account?
          </p>
          <button
            onClick={onNavigateToCreateAccount}
            className="text-base font-bold text-primary hover:text-primary-container transition-colors underline underline-offset-4 decoration-primary/20 hover:decoration-primary"
          >
            Create Account
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
