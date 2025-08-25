import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';

export async function POST(request) {
  console.log('📤 PDF Upload Request Received');
  
  try {
    const { db } = await connectToDatabase();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('pdf');
    const scheme = formData.get('scheme');
    const semester = formData.get('semester');
    const branch = formData.get('branch');
    const subject = formData.get('subject');
    const subjectCode = formData.get('subjectCode');
    const description = formData.get('description');
    const tags = formData.get('tags');

    // Comprehensive validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    if (!scheme || !semester || !branch || !subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: scheme, semester, branch, and subject are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed. Selected file type: ' + file.type },
        { status: 400 }
      );
    }

    // Validate file size (max 15MB to stay within MongoDB limits)
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size allowed is 15MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB` },
        { status: 400 }
      );
    }

    console.log(`📋 Upload Details:`, {
      filename: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
      scheme,
      semester,
      branch,
      subject,
      subjectCode
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check for duplicate files
    const existingFile = await db.collection('pdf_notes').findOne({
      scheme,
      semester,
      branch,
      subject,
      originalName: file.name
    });

    if (existingFile) {
      return NextResponse.json(
        { success: false, error: 'A PDF with the same name already exists for this subject. Please rename your file or check if it\'s already uploaded.' },
        { status: 409 }
      );
    }

    // Create PDF document
    const pdfDocument = {
      filename: `${semester}_${scheme}_${branch}_${subject.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      originalName: file.name,
      scheme: scheme,
      semester: semester,
      branch: branch,
      subject: subject,
      subjectCode: subjectCode || `${branch}${semester}XX`,
      description: description || `Study material for ${subject} - ${scheme} Scheme`,
      fileSize: file.size,
      uploadDate: new Date(),
      downloadCount: 0,
      contentType: file.type,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [subject.toLowerCase(), branch.toLowerCase(), scheme],
      pdfData: buffer
    };

    // Insert into MongoDB
    const result = await db.collection('pdf_notes').insertOne(pdfDocument);

    // Update subject metadata
    await db.collection('subjects_metadata').updateOne(
      {
        scheme,
        semester,
        branch,
        subject
      },
      {
        $set: {
          subjectCode: subjectCode || `${branch}${semester}XX`,
          lastUpdated: new Date()
        },
        $inc: { resourceCount: 1 }
      },
      { upsert: true }
    );

    console.log('✅ PDF uploaded successfully to MongoDB Atlas:', result.insertedId);

    return NextResponse.json({
      success: true,
      message: 'PDF uploaded successfully to VTU Resources database!',
      data: {
        fileId: result.insertedId,
        filename: pdfDocument.filename,
        originalName: file.name,
        fileSize: file.size,
        subject: subject,
        scheme: scheme,
        semester: semester,
        branch: branch
      }
    });

  } catch (error) {
    const errorMessage = error.message;
    console.error('❌ PDF upload error:', error);
    
    if (errorMessage.includes('SSL') || errorMessage.includes('TLS') || errorMessage.includes('timed out')) {
      return NextResponse.json({
        success: false,
        error: 'Connection security error',
        details: 'Could not connect to the database. This is often due to network access restrictions.',
        suggestions: [
          'Verify your current IP address is whitelisted in MongoDB Atlas under "Network Access".',
          'For testing, you can temporarily allow access from anywhere (0.0.0.0/0).',
          'Check if you are behind a corporate firewall that might be blocking the connection.'
        ]
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Upload failed',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PDF Upload API - Use POST method to upload files',
    supportedFormats: ['application/pdf'],
    maxFileSize: '15MB',
    requiredFields: ['pdf', 'scheme', 'semester', 'branch', 'subject']
  });
}
