import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing request ID' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.gonkarouter.io/v1/receipts/${id}`);
    if (!res.ok) {
      return NextResponse.json({ error: 'Receipt not found or still propagating' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(`Error in receipt proxy for ID ${id}:`, err);
    return NextResponse.json(
      { error: 'Failed to connect to Gonka receipts database' },
      { status: 500 }
    );
  }
}
