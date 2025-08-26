import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheme = searchParams.get('scheme');
    const semester = searchParams.get('semester');
    const branch = searchParams.get('branch');
    const subject = searchParams.get('subject');

    console.log('📚 Fetching VTU Resources:', { scheme, semester, branch, subject });

    const { db } = await connectToDatabase();

    // Build filter
    const filter = {};
    if (scheme) filter.scheme = scheme;
    if (semester) filter.semester = semester;  
    if (branch) filter.branch = branch;
    if (subject) filter.subject = { $regex: new RegExp(subject, 'i') };

    // Get resources (exclude PDF data for performance)
    const resources = await db.collection('pdf_notes')
      .find(filter, { 
        projection: { 
          pdfData: 0 // Exclude binary data
        } 
      })
      .sort({ uploadDate: -1 })
      .toArray();

    // Get subject metadata for organization
    const subjects = await db.collection('subjects_metadata')
      .find(filter)
      .sort({ scheme: 1, semester: 1, subject: 1 })
      .toArray();

    console.log(`✅ Found ${resources.length} VTU resources`);

    return NextResponse.json({
      success: true,
      resources,
      subjects,
      totalCount: resources.length,
      filters: { scheme, semester, branch, subject }
    });

  } catch (error) {
    console.error('❌ Error fetching VTU resources:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch resources from database',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
