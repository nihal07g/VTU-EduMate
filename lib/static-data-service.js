// Static data service for Firebase hosting deployment
// This replaces API routes for static deployment

// ResourceItem structure:
// {
//   _id: string,
//   filename: string,
//   originalName: string,
//   scheme: string,
//   semester: string,
//   branch: string,
//   subject: string,
//   subjectCode: string,
//   description: string (optional),
//   fileSize: number,
//   uploadDate: string,
//   downloadCount: number,
//   tags: string[],
//   googleDriveUrl: string (optional),
//   previewUrl: string (optional)
// }

// Mock data with Cloud Computing notes as the first resource
const mockResources = [
  {
    _id: 'cc-6th-sem-2022',
    filename: 'cloud-computing-bcs601.pdf',
    originalName: 'Cloud Computing Complete Notes.pdf',
    scheme: '2022',
    semester: '6',
    branch: 'CSE', // Computer Science Engineering
    subject: 'Cloud Computing',
    subjectCode: 'BCS601',
    description: 'Comprehensive Cloud Computing notes for 6th semester 2022 scheme. Covers all modules including Cloud Computing fundamentals, virtualization, service models (IaaS, PaaS, SaaS), deployment models, security, and emerging trends.',
    fileSize: 5242880, // Approximately 5MB
    uploadDate: '2025-08-25T10:30:00Z',
    downloadCount: 0, // New upload
    tags: ['cloud-computing', 'virtualization', 'aws', 'azure', 'saas', 'paas', 'iaas', '6th-semester'],
    googleDriveUrl: 'https://drive.google.com/file/d/1ZGoHvPlZGuxl4wxQ55Ch2Z8JwSfzVVZZ/view?usp=sharing',
    previewUrl: 'https://drive.google.com/file/d/1ZGoHvPlZGuxl4wxQ55Ch2Z8JwSfzVVZZ/preview'
  },
  {
    _id: 'cc-6th-sem-2022-ise',
    filename: 'cloud-computing-bcs601-ise.pdf',
    originalName: 'Cloud Computing Complete Notes.pdf',
    scheme: '2022',
    semester: '6',
    branch: 'ISE', // Information Science Engineering (same notes for ISE)
    subject: 'Cloud Computing',
    subjectCode: 'BCS601',
    description: 'Comprehensive Cloud Computing notes for 6th semester 2022 scheme. Covers all modules including Cloud Computing fundamentals, virtualization, service models (IaaS, PaaS, SaaS), deployment models, security, and emerging trends.',
    fileSize: 5242880,
    uploadDate: '2025-08-25T10:30:00Z',
    downloadCount: 0,
    tags: ['cloud-computing', 'virtualization', 'aws', 'azure', 'saas', 'paas', 'iaas', '6th-semester'],
    googleDriveUrl: 'https://drive.google.com/file/d/1ZGoHvPlZGuxl4wxQ55Ch2Z8JwSfzVVZZ/view?usp=sharing',
    previewUrl: 'https://drive.google.com/file/d/1ZGoHvPlZGuxl4wxQ55Ch2Z8JwSfzVVZZ/preview'
  },
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

export async function getResources(filters) {
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

export async function uploadResource(data) {
  // Simulate upload for static deployment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: false,
    message: 'Upload feature requires server deployment. This is a static demo.'
  };
}

export async function downloadResource(id) {
  // Find the resource
  const resource = mockResources.find(r => r._id === id);
  
  if (resource && resource.googleDriveUrl) {
    // Convert Google Drive view URL to download URL
    const fileId = resource.googleDriveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) {
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      // Increment download count (in real app, this would be stored)
      resource.downloadCount += 1;
      
      return {
        success: true,
        message: 'Download started',
        url: downloadUrl
      };
    }
  }
  
  return {
    success: false,
    message: 'Resource not found or download not available'
  };
}
