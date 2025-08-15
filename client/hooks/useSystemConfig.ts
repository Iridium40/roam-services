import { useState, useEffect } from 'react';
import { getSystemConfig, initializeSystemBranding, SystemConfig } from '@/utils/systemConfig';

/**
 * React hook for managing system configuration
 */
export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize branding (favicon) and get config
        const systemConfig = await initializeSystemBranding();
        setConfig(systemConfig);
        
        console.log('✅ System config loaded:', systemConfig);
      } catch (err: any) {
        console.error('❌ Error loading system config:', err);
        setError(err.message || 'Failed to load system configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const refreshConfig = async () => {
    try {
      setLoading(true);
      const systemConfig = await getSystemConfig();
      setConfig(systemConfig);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh system configuration');
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    error,
    refreshConfig,
    // Convenience getters
    favicon: config.favicon,
    siteLogo: config.site_logo,
  };
}
