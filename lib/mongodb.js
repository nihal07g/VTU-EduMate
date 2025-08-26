import { MongoClient, Db } from 'mongodb';

const uri = "mongodb+srv://nihagb80:2noAp34s9kwXiAT8@cluster0.bhceamq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const options = {
  tls: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
};

let client;
let clientPromise;

// Global type declaration (commented out for JavaScript)
// declare global {
//   var _mongoClientPromise: Promise<MongoClient>;
// }

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db('vtu_resources');
    console.log('✅ Connected to MongoDB Atlas - vtu_resources database');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// PDFDocument structure:
// {
//   _id?: string,
//   filename: string,
//   originalName: string,
//   scheme: string,
//   semester: string,
//   branch: string,
//   subject: string,
//   subjectCode: string,
//   description?: string,
//   fileSize: number,
//   uploadDate: Date,
//   downloadCount: number,
//   contentType: string,
//   tags: string[],
//   pdfData: Buffer
// }
