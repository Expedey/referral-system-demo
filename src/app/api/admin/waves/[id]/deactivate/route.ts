import { NextRequest, NextResponse } from 'next/server';
import { WaveService } from '@/services/waveService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await WaveService.deactivateWave(id);
    
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