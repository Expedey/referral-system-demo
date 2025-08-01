import { NextRequest, NextResponse } from 'next/server';
import { WaveService } from '@/services/waveService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await WaveService.deactivateWave(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to deactivate wave' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating wave:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate wave' },
      { status: 500 }
    );
  }
} 