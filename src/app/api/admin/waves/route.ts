import { NextRequest, NextResponse } from 'next/server';
import { WaveService, CreateWaveData } from '@/services/waveService';

export async function GET() {
  try {
    const waves = await WaveService.getAllWavesWithStats();
    return NextResponse.json({ waves });
  } catch (error) {
    console.error('Error fetching waves:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waves' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateWaveData = await request.json();
    
    // Validate required fields
    if (!body.name || !body.start_position || !body.end_position) {
      return NextResponse.json(
        { error: 'Name, start_position, and end_position are required' },
        { status: 400 }
      );
    }

    // Validate position range
    if (body.start_position > body.end_position) {
      return NextResponse.json(
        { error: 'Start position must be less than or equal to end position' },
        { status: 400 }
      );
    }

    const wave = await WaveService.createWave(body);
    return NextResponse.json({ wave }, { status: 201 });
  } catch (error) {
    console.error('Error creating wave:', error);
    return NextResponse.json(
      { error: 'Failed to create wave' },
      { status: 500 }
    );
  }
} 