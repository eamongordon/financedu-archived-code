import { mediaManager } from 'wix-media-backend';

// Sample fileUrl value: 'wix:image://v1/0abec0_51b1141c839c4d349035941cb9427ebe~mv2.jpg/child-on-bike.jpg#originWidth=768&originHeight=1024'

export async function getDownloadUrlFunction(fileUrl) {
  const myFileDownloadUrl = await mediaManager.getDownloadUrl(fileUrl);  
  return myFileDownloadUrl;
}


/* Promise resolves to:
 * "https://download-files.wix.com/_api/download/file?downloadToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJpc3MiO..."
 */
