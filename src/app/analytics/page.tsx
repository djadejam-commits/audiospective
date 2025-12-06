'use client';

import { TrendingUp, Calendar, Zap, PieChart } from 'lucide-react';
import ParticleField from '@/components/ParticleField';
import Sidebar from '@/components/Sidebar';

export default function AnalyticsPage() {
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
            <h1 className="text-4xl font-bold text-gradient mb-2">Advanced Analytics</h1>
            <p className="text-gray-400">Deep dive into your listening patterns and music insights</p>
          </div>

          {/* Coming Soon Card */}
          <div className="glass-panel rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-cyan/10 blur-3xl rounded-full" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-green/10 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-brand-gradient mx-auto mb-6 flex items-center justify-center shadow-neon-cyan">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Unlock powerful insights into your music journey! Advanced charts and analytics are on the way.
              </p>

              {/* Feature Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                <div className="glass-panel rounded-xl p-6">
                  <Calendar className="w-8 h-8 text-brand-cyan mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Timeline Analysis</h3>
                  <p className="text-sm text-gray-400">Track your listening over time</p>
                </div>

                <div className="glass-panel rounded-xl p-6">
                  <Zap className="w-8 h-8 text-brand-purple mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Discovery Insights</h3>
                  <p className="text-sm text-gray-400">See when you found new favorites</p>
                </div>

                <div className="glass-panel rounded-xl p-6">
                  <PieChart className="w-8 h-8 text-brand-green mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Genre Evolution</h3>
                  <p className="text-sm text-gray-400">Watch your taste evolve</p>
                </div>

                <div className="glass-panel rounded-xl p-6">
                  <TrendingUp className="w-8 h-8 text-brand-orange mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">Comparisons</h3>
                  <p className="text-sm text-gray-400">Month vs month, year vs year</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
