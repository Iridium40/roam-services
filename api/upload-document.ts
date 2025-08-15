import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for file uploads
const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the authorization header to verify user is authenticated
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string;
    const providerId = formData.get('providerId') as string;
    const businessId = formData.get('businessId') as string;

    if (!file || !folderPath || !providerId || !businessId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: file, folderPath, providerId, businessId' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    console.log('Uploading file via service role:', {
      fileName: file.name,
      filePath,
      fileSize: file.size,
      providerId,
      businessId
    });

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer();

    // Upload file using service role (bypasses RLS)
    const { data, error } = await supabase.storage
      .from('roam-file-storage')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return new Response(JSON.stringify({ 
        error: 'Upload failed',
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('roam-file-storage')
      .getPublicUrl(filePath);

    console.log('File uploaded successfully:', {
      filePath: data.path,
      publicUrl
    });

    return new Response(JSON.stringify({
      success: true,
      publicUrl,
      filePath: data.path,
      fileName
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload endpoint error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  runtime: 'edge',
};
