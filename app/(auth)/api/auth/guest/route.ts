import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Guest authentication is disabled - redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
