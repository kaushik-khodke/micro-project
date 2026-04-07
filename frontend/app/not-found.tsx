'use client';

import Header from '@/components/header';
import { Heart, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="px-8 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center max-w-md">
          {/* Animated 404 */}
          <div className="relative mb-8">
            <div className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 leading-none animate-fade-in select-none">
              404
            </div>
            <div className="absolute inset-0 text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 leading-none blur-2xl opacity-30 select-none">
              404
            </div>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <Heart size={28} className="text-white" />
          </div>

          <h2 className="text-xl font-black text-slate-800 mb-2">Page Not Found</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            The page you're looking for doesn't exist or has been moved. Let's get you back to safety.
          </p>
          
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 gap-2">
                <Home size={16} />
                Dashboard
              </Button>
            </Link>
            <Link href="/patients">
              <Button variant="outline" className="rounded-xl font-bold gap-2">
                <ArrowLeft size={16} />
                Patients
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
