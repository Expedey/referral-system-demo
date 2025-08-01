import { NextRequest, NextResponse } from 'next/server';
import { WaveService, CreateWaveData } from '@/services/waveService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wave = await WaveService.getWaveById(id);
    
    if (!wave) {
      return NextResponse.json(
        { error: 'Wave not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ wave });
  } catch (error) {
    console.error('Error fetching wave:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wave' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<CreateWaveData> = await request.json();
    
    // Validate position range if both are provided
    if (body.start_position !== undefined && body.end_position !== undefined) {
      if (body.start_position > body.end_position) {
        return NextResponse.json(
          { error: 'Start position must be less than or equal to end position' },
          { status: 400 }
        );
      }
    }

    const wave = await WaveService.updateWave(id, body);
    
    if (!wave) {
      return NextResponse.json(
        { error: 'Wave not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ wave });
  } catch (error) {
    console.error('Error updating wave:', error);
    return NextResponse.json(
      { error: 'Failed to update wave' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await WaveService.deleteWave(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Wave not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wave:', error);
    return NextResponse.json(
      { error: 'Failed to delete wave' },
      { status: 500 }
    );
  }
} 