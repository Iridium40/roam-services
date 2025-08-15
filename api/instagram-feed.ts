import type { VercelRequest, VercelResponse } from "@vercel/node";

interface InstagramPost {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  caption?: string;
  timestamp: string;
  permalink: string;
}

interface InstagramApiResponse {
  data: InstagramPost[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!accessToken) {
      console.warn(
        "Instagram access token not configured, using fallback data",
      );

      // Return mock data when token is not available
      const mockData = [
        {
          id: "1",
          media_type: "IMAGE" as const,
          media_url:
            "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
          caption:
            "Transform your look with our amazing beauty services! ✨ #ROAMBeauty #GlowUp #roam_yourbestlife",
          timestamp: new Date().toISOString(),
          permalink: "https://www.instagram.com/roam_yourbestlife/",
          likes: 127,
          comments: 12,
        },
        {
          id: "2",
          media_type: "IMAGE" as const,
          media_url:
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
          caption:
            "Fitness goals achieved with our certified trainers 💪 #ROAMFitness #HealthyLifestyle #roam_yourbestlife",
          timestamp: new Date().toISOString(),
          permalink: "https://www.instagram.com/roam_yourbestlife/",
          likes: 89,
          comments: 8,
        },
        {
          id: "3",
          media_type: "IMAGE" as const,
          media_url:
            "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop",
          caption:
            "Wellness Wednesday: Find your inner peace with our meditation experts 🧘‍♀️ #ROAMWellness #roam_yourbestlife",
          timestamp: new Date().toISOString(),
          permalink: "https://www.instagram.com/roam_yourbestlife/",
          likes: 156,
          comments: 15,
        },
        {
          id: "4",
          media_type: "IMAGE" as const,
          media_url:
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
          caption:
            "Home organization made easy! Our lifestyle experts can help ✨ #ROAMLifestyle #OrganizedHome #roam_yourbestlife",
          timestamp: new Date().toISOString(),
          permalink: "https://www.instagram.com/roam_yourbestlife/",
          likes: 203,
          comments: 24,
        },
        {
          id: "5",
          media_type: "IMAGE" as const,
          media_url:
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
          caption:
            "Behind the scenes with our amazing service providers! 👥 #ROAMTeam #BehindTheScenes #roam_yourbestlife",
          timestamp: new Date().toISOString(),
          permalink: "https://www.instagram.com/roam_yourbestlife/",
          likes: 78,
          comments: 6,
        },
        {
          id: "6",
          media_type: "IMAGE" as const,
          media_url:
            "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop",
          caption:
            "Client transformation Tuesday! Another happy ROAM customer 🌟 #ROAMResults #Transformation #roam_yourbestlife",
          timestamp: new Date().toISOString(),
          permalink: "https://www.instagram.com/roam_yourbestlife/",
          likes: 342,
          comments: 31,
        },
      ];

      return res.status(200).json({
        success: true,
        data: mockData,
        source: "fallback",
      });
    }

    // Fetch real Instagram data
    const fields = "id,media_type,media_url,caption,timestamp,permalink";
    const limit = req.query.limit || 6;

    const instagramUrl = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

    console.log("Fetching Instagram data from API...");

    const response = await fetch(instagramUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Instagram API error:", response.status, errorText);

      // If API fails, return fallback data
      throw new Error(
        `Instagram API returned ${response.status}: ${errorText}`,
      );
    }

    const data: InstagramApiResponse = await response.json();

    console.log(`Successfully fetched ${data.data.length} Instagram posts`);

    // Filter for images only and add engagement data (mock for now)
    const processedPosts = data.data
      .filter(
        (post) =>
          post.media_type === "IMAGE" || post.media_type === "CAROUSEL_ALBUM",
      )
      .map((post) => ({
        ...post,
        likes: Math.floor(Math.random() * 500) + 50, // Mock engagement data
        comments: Math.floor(Math.random() * 50) + 5,
      }));

    return res.status(200).json({
      success: true,
      data: processedPosts,
      source: "instagram_api",
      total: processedPosts.length,
    });
  } catch (error: any) {
    console.error("Error fetching Instagram data:", error);

    // Return fallback data on error
    const fallbackData = [
      {
        id: "fallback_1",
        media_type: "IMAGE" as const,
        media_url:
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
        caption:
          "Transform your look with our amazing beauty services! ✨ #ROAMBeauty #GlowUp #roam_yourbestlife",
        timestamp: new Date().toISOString(),
        permalink: "https://www.instagram.com/roam_yourbestlife/",
        likes: 127,
        comments: 12,
      },
    ];

    return res.status(200).json({
      success: true,
      data: fallbackData,
      source: "fallback_error",
      error: error.message,
    });
  }
}
