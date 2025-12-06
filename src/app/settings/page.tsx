'use client';

import { Settings as SettingsIcon, User, Database, Bell, Palette } from 'lucide-react';
import ParticleField from '@/components/ParticleField';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-audio-dark overflow-hidden relative">
      <div className="fixed inset-0 bg-subtle-glow pointer-events-none z-0" />
      <ParticleField particleCount={40} className="opacity-20" />
      <Sidebar />

      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 z-10 relative min-h-screen pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>

          {/* Coming Soon Card */}
          <div className="glass-panel rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-green/10 blur-3xl rounded-full" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-purple/10 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-brand-gradient mx-auto mb-6 flex items-center justify-center shadow-neon-green">
                <SettingsIcon className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Full settings panel is in development! Customize your experience and manage your account.
              </p>

              {/* Feature Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                <div className="glass-panel rounded-xl p-6">
                  <User className="w-8 h-8 text-brand-cyan mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Account</h3>
                  <p className="text-sm text-gray-400">Profile and connections</p>
                </div>

                <div className="glass-panel rounded-xl p-6">
                  <Database className="w-8 h-8 text-brand-purple mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Archival</h3>
                  <p className="text-sm text-gray-400">Automatic sync preferences</p>
                </div>

                <div className="glass-panel rounded-xl p-6">
                  <Bell className="w-8 h-8 text-brand-green mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Notifications</h3>
                  <p className="text-sm text-gray-400">Email and push alerts</p>
                </div>

                <div className="glass-panel rounded-xl p-6">
                  <Palette className="w-8 h-8 text-brand-orange mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Appearance</h3>
                  <p className="text-sm text-gray-400">Themes and display</p>
                </div>
              </div>

              {/* Temporary Note */}
              <div className="mt-8 glass-panel rounded-xl p-4 max-w-2xl mx-auto border border-brand-cyan/20">
                <p className="text-sm text-gray-300">
                  <strong className="text-brand-cyan">Note:</strong> Use the Profile page to manage your Spotify connection and sign out for now.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
