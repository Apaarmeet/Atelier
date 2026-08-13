import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow requests to pass through smoothly to dashboard layout
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
