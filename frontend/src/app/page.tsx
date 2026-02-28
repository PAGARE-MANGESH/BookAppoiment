"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginView from "@/components/auth/LoginView";
import OtpView from "@/components/auth/OtpView";
import AxiosInstance from "@/lib/AxiosInstance";
import { useRouter } from "next/navigation";
import LoadingOverlay from "../components/LoadingOverlay";
import { showError, showSuccess } from "@/lib/alerts";
import { Heart, Activity } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [mobile, setMobile] = useState("");
  const [signupName, setSignupName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      const role = localStorage.getItem('user_role');
      router.push(role === 'doctor' ? '/doctor-dashboard' : '/home');
    }
  }, [router]);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await AxiosInstance.post('auth/send_otp/', { mobile });
      setStep(2);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (otp: string, name?: string) => {
    setLoading(true);
    try {
      const response = await AxiosInstance.post('auth/verify_otp/', {
        mobile,
        code: otp,
        name: name // Pass name if it's a signup flow
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_name', response.data.user.name);
      localStorage.setItem('user_role', response.data.user.role || 'patient');
      if (response.data.user.doctor_id) {
        localStorage.setItem('doctor_id', String(response.data.user.doctor_id));
      }

      const isDoctor = response.data.user.role === 'doctor';
      showSuccess(name ? "Registration Successful!" : "Login Successful!");
      setTimeout(() => {
        router.push(isDoctor ? '/doctor-dashboard' : '/home');
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsLogin = async (id: string, pass: string) => {
    setLoading(true);
    try {
      const response = await AxiosInstance.post('token/', {
        username: id,
        password: pass
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_name', response.data.user.name);
      localStorage.setItem('user_role', response.data.user.role || 'patient');
      if (response.data.user.doctor_id) {
        localStorage.setItem('doctor_id', String(response.data.user.doctor_id));
      }

      const isDoctor = response.data.user.role === 'doctor';
      showSuccess("Login Successful!");
      setTimeout(() => {
        router.push(isDoctor ? '/doctor-dashboard' : '/home');
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (username: string, mob: string, pass: string) => {
    setLoading(true);
    try {
      await AxiosInstance.post('register/', {
        username,
        mobile: mob,
        password: pass
      });
      showSuccess("Account created successfully!");
      // Auto login after signup
      await handleCredentialsLogin(username, pass);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center p-0 bg-auth-gradient overflow-hidden">
      <AnimatePresence>
        {loading && <LoadingOverlay />}
      </AnimatePresence>

      <div className="row w-100 h-100 g-0">
        {/* Left Side: Brand Showcase */}
        <div className="col-lg-6 d-none d-lg-flex flex-column align-items-center justify-content-center text-center p-5 position-relative">
          {/* Enhanced Glass Orbs */}
          <div className="position-absolute top-0 start-0 translate-middle-x bg-primary rounded-circle opacity-10" style={{ width: '600px', height: '600px', filter: 'blur(120px)' }} />
          <div className="position-absolute bottom-0 end-0 bg-purple rounded-circle opacity-5" style={{ width: '400px', height: '400px', filter: 'blur(100px)' }} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="z-10"
          >
            {/* Professional Multi-layer Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="position-relative d-inline-block mb-5 cursor-pointer"
            >
              {/* Rotating Outer Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="position-absolute top-50 start-50 translate-middle border border-primary opacity-20"
                style={{ width: '160px', height: '160px', borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
              />

              {/* Pulsing Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="position-absolute top-50 start-50 translate-middle rounded-circle bg-primary-soft"
                style={{ width: '140px', height: '140px', filter: 'blur(30px)' }}
              />

              <div className="position-relative bg-white rounded-5 shadow-premium-lg d-flex align-items-center justify-content-center" style={{ width: '110px', height: '110px', border: '1px solid rgba(70, 194, 222, 0.3)', backdropFilter: 'blur(10px)' }}>
                <motion.div
                  className="bg-primary-gradient rounded-4 p-2 d-flex align-items-center justify-content-center"
                  style={{ width: '76px', height: '76px' }}
                  whileHover={{ rotate: 10 }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      filter: ["drop-shadow(0 0 0px #fff)", "drop-shadow(0 0 8px #fff)", "drop-shadow(0 0 0px #fff)"]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  >
                    <Heart size={42} color="white" fill="white" />
                  </motion.div>
                </motion.div>

                {/* Synchronized Secondary Badge */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="position-absolute top-0 start-100 translate-middle bg-white rounded-circle shadow-premium p-2 border border-primary-subtle"
                  style={{ marginLeft: '-8px', marginTop: '8px' }}
                >
                  <Activity size={18} className="text-primary" />
                </motion.div>
              </div>
            </motion.div>

            <h1 className="display-4 fw-bold outfit tracking-tighter text-dark mb-3">
              Health<span className="text-primary">Sync</span>
            </h1>
            <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
              <div className="h-px bg-light-subtle flex-grow-1" style={{ maxWidth: '40px' }} />
              <span className="text-primary smallest fw-bold uppercase tracking-widest">Medical Management</span>
              <div className="h-px bg-light-subtle flex-grow-1" style={{ maxWidth: '40px' }} />
            </div>
            <p className="fs-5 text-muted fw-medium outfit opacity-75 max-w-lg mx-auto leading-relaxed">
              Accelerating Healthcare through <br />
              <span className="text-dark fw-bold">Synchronized Digital Innovation.</span>
            </p>
          </motion.div>
        </div>

        {/* Right Side: Form Container */}
        <div className="col-lg-6 col-md-12 d-flex align-items-center justify-content-center p-4">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-100 glass-container p-4 p-md-5 shadow-premium glass-container-floating"
            style={{
              maxWidth: '480px',
              zIndex: 10,
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '32px'
            }}
          >
            <div className="text-center mb-5 d-lg-none">
              <div className="position-relative d-inline-block mb-3">
                <div className="bg-white rounded-4 shadow-premium d-flex align-items-center justify-content-center border" style={{ width: '64px', height: '64px' }}>
                  <div className="bg-primary-gradient rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                    <Heart size={24} color="white" fill="white" />
                  </div>
                </div>
              </div>
              <h2 className="fw-bold outfit text-dark tracking-tight">HealthSync</h2>
            </div>

            <div className="mb-5 d-none d-lg-block">
              <h3 className="fw-bold outfit text-dark mb-1">Welcome</h3>
              <p className="text-muted small">Select your role, then sign in or create an account</p>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <LoginView
                  key="login"
                  mobile={mobile}
                  setMobile={setMobile}
                  onNext={handleSendOtp}
                  onCredentialsLogin={handleCredentialsLogin}
                  onSignup={handleSignup}
                  loading={loading}
                />
              ) : (
                <OtpView
                  key="otp"
                  mobile={mobile}
                  onBack={() => setStep(1)}
                  onVerify={(otp) => handleVerify(otp, signupName)}
                  loading={loading}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
