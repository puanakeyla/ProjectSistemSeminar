import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, LogIn, CheckCircle2, Calendar, FileCheck, QrCode, Loader2 } from 'lucide-react'
import { authAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription } from '../../components/ui/alert';
import teamworkIllustration from '../../assets/logologin.jpg';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      onLogin(response.user);
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || 'Email atau kata sandi salah!';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: CheckCircle2, text: 'Pengajuan seminar online dengan approval multi-level' },
    { icon: Calendar, text: 'Penjadwalan otomatis dengan notifikasi real-time' },
    { icon: FileCheck, text: 'Manajemen revisi dan dokumentasi tersentralisasi' },
    { icon: QrCode, text: 'QR Code absensi dan laporan kehadiran digital' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1929] via-[#001D39] to-[#0A4174] flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-primary-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-accent-purple/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl relative z-10"
      >
        {/* Main Container */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-depth border border-white/20 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Info Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-dark-800 dark:to-dark-900 p-8 lg:p-12"
            >
              {/* Logo/Illustration */}
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 mb-8 shadow-soft">
                <img
                  src={teamworkIllustration}
                  alt="SEMAR Platform"
                  className="w-full max-w-sm mx-auto"
                />
              </div>

              {/* Info Content */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full">
                  <GraduationCap className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-600">
                    Seminar Management and Registration
                  </span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  SEMAR - Platform Seminar Digital Terintegrasi
                </h1>

                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                  Sistem informasi modern untuk mengelola pengajuan, penjadwalan, dan dokumentasi seminar mahasiswa secara efisien dan terstruktur.
                </p>

                {/* Features List */}
                <ul className="space-y-4 pt-4">
                  {features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-xs">
                        <feature.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 pt-0.5">
                        {feature.text}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Form Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full lg:w-[480px] bg-gray-50 dark:bg-dark-800 p-8 lg:p-12"
            >
              <div className="space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary-500">
                    Portal SEMAR - Teknik Elektro
                  </p>
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Masuk ke Sistem
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Masukkan email atau NIM untuk mengakses sistem
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Alert */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Email/NIM Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      Email / NIM
                    </label>
                    <Input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan email atau NIM Anda"
                      required
                      disabled={loading}
                      error={!!error}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      Kata Sandi
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi Anda"
                      required
                      disabled={loading}
                      error={!!error}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memuat...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        Masuk ke Sistem
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-center text-sm text-white/90 font-semibold"
        >
          © 2025 SEMAR - Seminar Management and Registration Universitas Lampung
        </motion.footer>
      </motion.div>
    </div>
  );
}

export default Login;
