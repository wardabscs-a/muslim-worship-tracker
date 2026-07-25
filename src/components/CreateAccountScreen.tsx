/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Mail, Lock, ShieldAlert, ArrowLeft, ArrowRight, Eye, EyeOff, Leaf } from "lucide-react";
import { motion } from "motion/react";
import { signUpWithEmail, signInWithGoogle } from "../lib/firebase";

interface CreateAccountScreenProps {
  onRegisterSuccess: (name: string, email: string, uid?: string) => void;
  onNavigateToLogin: () => void;
}

export default function CreateAccountScreen({
  onRegisterSuccess,
  onNavigateToLogin,
}: CreateAccountScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrorMsg("");
    try {
      const user = await signInWithGoogle();
      const displayName = user.displayName || user.email?.split("@")[0] || "User";
      onRegisterSuccess(displayName, user.email || "", user.uid);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-up cancelled.");
      } else {
        setErrorMsg(err.message || "Failed to sign up with Google.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const user = await signUpWithEmail(name, email, password);
      onRegisterSuccess(name, email, user.uid);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("An account with this email already exists. Please sign in.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("Password is too weak. Please choose a stronger password.");
      } else {
        setErrorMsg(err.message || "Failed to create account.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-start min-h-screen px-6 py-6 pb-12 relative">
      {/* Top Navigation / Back Button */}
      <header className="w-full flex items-center justify-start py-4">
        <button
          onClick={onNavigateToLogin}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-col items-center"
      >
        {/* Logo and Branding */}
        <div className="flex flex-col items-center text-center mb-8 mt-2">
          <div className="h-16 w-16 bg-primary-container text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 mb-4">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary mb-1">Create Account</h1>
          <p className="text-sm text-gray-500 font-medium px-4">
            Join the community to track your spiritual growth.
          </p>
        </div>

        {/* Registration Form */}
        <form className="w-full space-y-5" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100">
              {errorMsg}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase ml-1" htmlFor="name">
              Full Name
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <User className="h-5 w-5" />
              </span>
              <input
                className="w-full pl-12 pr-4 h-12 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm placeholder:text-gray-400 text-gray-800 font-medium shadow-sm shadow-gray-100/50"
                id="name"
                placeholder="Enter your full name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase ml-1" htmlFor="email">
              Email Address
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </span>
              <input
                className="w-full pl-12 pr-4 h-12 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm placeholder:text-gray-400 text-gray-800 font-medium shadow-sm shadow-gray-100/50"
                id="email"
                placeholder="email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase ml-1" htmlFor="password">
              Password
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <Lock className="h-5 w-5" />
              </span>
              <input
                className="w-full pl-12 pr-12 h-12 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm placeholder:text-gray-400 text-gray-800 font-medium shadow-sm shadow-gray-100/50"
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase ml-1" htmlFor="confirm_password">
              Confirm Password
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <input
                className="w-full pl-12 pr-4 h-12 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm placeholder:text-gray-400 text-gray-800 font-medium shadow-sm shadow-gray-100/50"
                id="confirm_password"
                placeholder="••••••••"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              disabled={isLoading}
              className="w-full h-12 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/10 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
              type="submit"
            >
              {isLoading ? (
                <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative flex items-center py-3 w-full">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-4 text-xs font-bold tracking-wider text-gray-400 uppercase">or</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        {/* Google Sign-Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
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
              <span>Sign up with Google</span>
            </>
          )}
        </button>

        {/* Terms & Privacy */}
        <p className="mt-4 text-center text-xs text-gray-400 px-6 leading-relaxed">
          By signing up, you agree to our{" "}
          <a className="text-primary font-bold underline underline-offset-4 decoration-primary/10 hover:decoration-primary" href="#">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="text-primary font-bold underline underline-offset-4 decoration-primary/10 hover:decoration-primary" href="#">
            Privacy Policy
          </a>
          .
        </p>

        {/* Footer */}
        <footer className="w-full mt-10 text-center">
          <span className="text-sm font-medium text-gray-500">Already have an account? </span>
          <button
            onClick={onNavigateToLogin}
            className="text-sm font-bold text-primary hover:underline transition-all"
          >
            Sign In
          </button>
        </footer>
      </motion.div>

      {/* Background Decorative Gradient blur */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 -translate-y-1/2"></div>
    </div>
  );
}
