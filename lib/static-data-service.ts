// Static data service for Firebase hosting deployment
// This replaces API routes for static deployment

export interface ResourceItem {
  _id: string;
  filename: string;
  originalName: string;
  scheme: string;
  semester: string;
  branch: string;
  subject: string;
  subjectCode: string;
  description?: string;
  fileSize: number;
  uploadDate: string;
  downloadCount: number;
  tags: string[];
}

// Mock data for demonstration
const mockResources: ResourceItem[] = [
  {
    _id: '1',
    filename: 'sample-notes.pdf',
    originalName: 'Data Structures Notes.pdf',
    scheme: '2022',
    semester: '3',
    branch: 'CSE',
    subject: 'Data Structures and Applications',
    subjectCode: 'BCS304',
    description: 'Comprehensive notes for Data Structures',
    fileSize: 2048576,
    uploadDate: '2024-01-15T10:30:00Z',
    downloadCount: 125,
    tags: ['notes', 'data-structures', 'algorithms']
  },
  {
    _id: '2',
    filename: 'algorithms-guide.pdf',
    originalName: 'Algorithm Analysis Guide.pdf',
    scheme: '2022',
    semester: '4',
    branch: 'CSE',
    subject: 'Analysis and Design of Algorithms',
    subjectCode: 'BCS403',
    description: 'Complete guide to algorithm analysis',
    fileSize: 3145728,
    uploadDate: '2024-02-20T14:15:00Z',
    downloadCount: 89,
    tags: ['algorithms', 'analysis', 'complexity']
  }
];

export async function getResources(filters: {
  scheme?: string;
  semester?: string;
  branch?: string;
}): Promise<{ resources: ResourceItem[]; total: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredResources = mockResources;
  
  if (filters.scheme) {
    filteredResources = filteredResources.filter(r => r.scheme === filters.scheme);
  }
  if (filters.semester) {
    filteredResources = filteredResources.filter(r => r.semester === filters.semester);
  }
  if (filters.branch) {
    filteredResources = filteredResources.filter(r => r.branch === filters.branch);
  }
  
  return {
    resources: filteredResources,
    total: filteredResources.length
  };
}

export async function uploadResource(data: FormData): Promise<{ success: boolean; message: string }> {
  // Simulate upload for static deployment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: false,
    message: 'Upload feature requires server deployment. This is a static demo.'
  };
}

export async function downloadResource(id: string): Promise<{ success: boolean; message: string }> {
  // Simulate download for static deployment
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: false,
    message: 'Download feature requires server deployment. This is a static demo.'
  };
}
