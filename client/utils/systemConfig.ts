import { supabase } from '@/lib/supabase';

export interface SystemConfig {
  favicon?: string;
  site_logo?: string;
}

/**
 * Fetch system configuration values from the database
 */
export async function getSystemConfig(): Promise<SystemConfig> {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('config_key, config_value')
      .in('config_key', ['favicon', 'site_logo']);

    if (error) {
      console.error('Error fetching system config:', error);
      return {};
    }

    // Convert array to object for easier access
    const config: SystemConfig = {};
    data?.forEach((item) => {
      if (item.config_key === 'favicon') {
        config.favicon = item.config_value;
      } else if (item.config_key === 'site_logo') {
        config.site_logo = item.config_value;
      }
    });

    return config;
  } catch (error) {
    console.error('Error fetching system config:', error);
    return {};
  }
}

/**
 * Update the favicon dynamically
 */
export function updateFavicon(faviconUrl: string) {
  try {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = faviconUrl;
    
    // Add to document head
    document.head.appendChild(link);
    
    console.log('✅ Favicon updated:', faviconUrl);
  } catch (error) {
    console.error('❌ Error updating favicon:', error);
  }
}

/**
 * Initialize system branding (favicon and logo) on app startup
 */
export async function initializeSystemBranding(): Promise<SystemConfig> {
  console.log('🎨 Initializing system branding...');
  
  const config = await getSystemConfig();
  
  // Update favicon if available
  if (config.favicon) {
    updateFavicon(config.favicon);
  }
  
  // Log logo URL for components to use
  if (config.site_logo) {
    console.log('🖼️ Site logo URL:', config.site_logo);
  }
  
  return config;
}

/**
 * Get a specific config value by key
 */
export async function getConfigValue(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', key)
      .single();

    if (error || !data) {
      console.warn(`Config key '${key}' not found`);
      return null;
    }

    return data.config_value;
  } catch (error) {
    console.error(`Error fetching config key '${key}':`, error);
    return null;
  }
}
