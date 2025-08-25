import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId || !ObjectId.isValid(fileId)) {
      return NextResponse.json(
        { success: false, error: 'Valid file ID required' },
        { status: 400 }
      );
    }

    console.log('📥 Download request for file:', fileId);

    const { db } = await connectToDatabase();

    // Find the PDF document
    const pdfDoc = await db.collection('pdf_notes').findOne({
      _id: new ObjectId(fileId)
    });

    if (!pdfDoc) {
      return NextResponse.json(
        { success: false, error: 'PDF not found in database' },
        { status: 404 }
      );
    }

    // Increment download count
    await db.collection('pdf_notes').updateOne(
      { _id: new ObjectId(fileId) },
      { 
        $inc: { downloadCount: 1 },
        $set: { lastDownloaded: new Date() }
      }
    );

    console.log(`✅ Serving PDF: ${pdfDoc.originalName} (${(pdfDoc.fileSize / 1024 / 1024).toFixed(1)}MB)`);

    // Return PDF file
    const pdfBuffer = Buffer.isBuffer(pdfDoc.pdfData) ? pdfDoc.pdfData : pdfDoc.pdfData.buffer;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfDoc.originalName}"`,
        'Content-Length': pdfDoc.fileSize.toString(),
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('❌ PDF download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Download failed',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
