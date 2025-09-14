'use client';

import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 lg:w-80 lg:h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 lg:w-96 lg:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mb-6 lg:mb-8 animate-float shadow-2xl">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4 lg:mb-6 leading-tight">
            SwingVista
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-blue-100 max-w-4xl mx-auto mb-8 lg:mb-12 font-light leading-relaxed px-4">
            Master your golf swing with <span className="font-bold text-white">AI-powered analysis</span> and real-time feedback
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center px-4">
            <Link 
              href="/camera" 
              className="group relative inline-flex items-center px-8 py-4 lg:px-12 lg:py-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg lg:text-xl font-bold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 transform w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <svg className="w-5 h-5 lg:w-6 lg:h-6 mr-3 lg:mr-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="relative z-10">Start Live Analysis</span>
            </Link>
            
            <Link 
              href="/upload" 
              className="group inline-flex items-center px-8 py-4 lg:px-12 lg:py-6 bg-white/10 backdrop-blur-md text-white text-lg lg:text-xl font-bold rounded-2xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform w-full sm:w-auto"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 mr-3 lg:mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Video
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 lg:mb-6">
              Powerful Features
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
              Everything you need to improve your golf game with cutting-edge technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Live Analysis Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-sm p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:animate-pulse">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">Live Analysis</h3>
                <p className="text-blue-100 text-base lg:text-lg leading-relaxed">
                  Real-time swing analysis with your camera for instant feedback and improvement
                </p>
              </div>
            </div>

            {/* Upload Video Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 backdrop-blur-sm p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:animate-pulse">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">Upload Video</h3>
                <p className="text-emerald-100 text-base lg:text-lg leading-relaxed">
                  Analyze recorded swing videos with detailed metrics and personalized insights
                </p>
              </div>
            </div>

            {/* Compare Swings Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-sm p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:animate-pulse">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">Compare Swings</h3>
                <p className="text-purple-100 text-base lg:text-lg leading-relaxed">
                  Track your progress over time with detailed comparisons and improvement metrics
                </p>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-orange-600/30 backdrop-blur-sm p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-orange-400/30 hover:border-orange-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:animate-pulse">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">AI Insights</h3>
                <p className="text-orange-100 text-base lg:text-lg leading-relaxed">
                  Advanced AI coaching and personalized tips coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Empty State */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm p-8 lg:p-16 rounded-2xl lg:rounded-3xl border border-white/20 shadow-2xl">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8">
              <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-6">Start Your Golf Journey</h3>
            <p className="text-lg lg:text-xl text-blue-200 mb-6 lg:mb-8 leading-relaxed">
              Begin analyzing your swings to see detailed statistics, track your progress, and improve your game
            </p>
            <Link 
              href="/camera" 
              className="inline-flex items-center px-8 py-4 lg:px-12 lg:py-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg lg:text-xl font-bold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 transform"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 mr-3 lg:mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Your First Analysis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}