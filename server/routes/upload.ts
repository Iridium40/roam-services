import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

// Initialize Supabase with service role key to bypass RLS
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

export const handleFileUpload = upload.single("file");

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Generate unique filename
    const fileExt = req.file.originalname.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `business-documents/${fileName}`;

    // Upload file using service role (bypasses RLS)
    const { data, error } = await supabase.storage
      .from("roam-file-storage")
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("roam-file-storage").getPublicUrl(filePath);

    res.json({
      success: true,
      publicUrl,
      filePath: data.path,
    });
  } catch (error: any) {
    console.error("Upload endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
};
