import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const response = await fetch('https://eth-sepolia.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RPC proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from RPC provider' }, { status: 500 });
  }
}