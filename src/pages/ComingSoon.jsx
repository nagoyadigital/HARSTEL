import React from 'react';
import { Link } from 'react-router-dom';
import { Construction, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComingSoon() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Construction className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold font-heading mb-2">Coming Soon</h1>
        <p className="text-muted-foreground mb-8">
          Fitur ini sedang dalam pengembangan. Kami sedang bekerja untuk menghadirkannya segera.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <Link to="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}