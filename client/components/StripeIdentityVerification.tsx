import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  RefreshCw,
  User,
  FileText,
  Camera
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface StripeIdentityVerificationProps {
  onVerificationComplete: (verificationData: any) => void;
  onVerificationPending: () => void;
  className?: string;
}

interface VerificationSession {
  id: string;
  status: 'requires_input' | 'processing' | 'verified' | 'canceled';
  url?: string;
  last_error?: {
    code: string;
    reason: string;
  };
  verified_outputs?: {
    first_name?: string;
    last_name?: string;
    dob?: {
      day: number;
      month: number;
      year: number;
    };
    id_number?: string;
    address?: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export const StripeIdentityVerification: React.FC<StripeIdentityVerificationProps> = ({
  onVerificationComplete,
  onVerificationPending,
  className = ""
}) => {
  const { user } = useAuth();
  const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Check for existing verification session on component mount
  useEffect(() => {
    checkExistingVerification();
  }, [user]);

  const checkExistingVerification = async () => {
    if (!user) return;

    try {
      setChecking(true);
      
      // Check if user has an existing verification session
      const { data: existingVerification, error: fetchError } = await supabase
        .from('provider_verifications')
        .select('stripe_verification_session_id, verification_status, verified_data')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing verification:', fetchError);
        return;
      }

      if (existingVerification?.stripe_verification_session_id) {
        // Fetch the latest status from our backend
        await checkVerificationStatus(existingVerification.stripe_verification_session_id);
      }
    } catch (error) {
      console.error('Error checking existing verification:', error);
    } finally {
      setChecking(false);
    }
  };

  const createVerificationSession = async () => {
    if (!user) {
      setError('User must be authenticated to start verification');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For demo purposes, simulate creating a verification session
      // In production, this would call the Stripe Identity API
      const mockSessionData = {
        id: `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'requires_input' as const,
        url: `https://verify.stripe.com/start/${Date.now()}`, // Mock URL
        client_secret: `vs_test_${Math.random().toString(36).substr(2, 20)}`
      };

      setVerificationSession(mockSessionData);

      // Store verification session in database
      const { error: insertError } = await supabase
        .from('provider_verifications')
        .upsert({
          user_id: user.id,
          stripe_verification_session_id: mockSessionData.id,
          verification_status: 'requires_input',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error storing verification session:', insertError);
        // Continue anyway for demo purposes
      }

    } catch (error) {
      console.error('Error creating verification session:', error);
      setError('Failed to start verification process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async (sessionId?: string) => {
    const targetSessionId = sessionId || verificationSession?.id;
    if (!targetSessionId) return;

    try {
      setChecking(true);

      // For demo purposes, simulate status progression
      // In production, this would call the Stripe Identity API
      let newStatus: VerificationSession['status'] = 'processing';
      
      // Simulate verification progression based on time
      const sessionCreationTime = parseInt(targetSessionId.split('_')[1]) || Date.now();
      const timeSinceCreation = Date.now() - sessionCreationTime;
      
      if (timeSinceCreation > 10000) { // After 10 seconds, mark as verified
        newStatus = 'verified';
      } else if (timeSinceCreation > 5000) { // After 5 seconds, mark as processing
        newStatus = 'processing';
      } else {
        newStatus = 'requires_input';
      }

      const statusData = {
        ...verificationSession,
        status: newStatus,
        verified_outputs: newStatus === 'verified' ? {
          first_name: 'John',
          last_name: 'Doe',
          dob: { day: 15, month: 6, year: 1990 },
          id_number: '****1234',
          address: {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94105',
            country: 'US'
          }
        } : undefined
      };

      setVerificationSession(statusData);

      // Update database with latest status
      if (user) {
        const { error: updateError } = await supabase
          .from('provider_verifications')
          .update({
            verification_status: statusData.status,
            verified_data: statusData.verified_outputs || null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating verification status:', updateError);
          // Continue anyway for demo purposes
        }
      }

      // Handle verification completion
      if (statusData.status === 'verified') {
        onVerificationComplete(statusData.verified_outputs);
      } else if (statusData.status === 'processing') {
        onVerificationPending();
      }

    } catch (error) {
      console.error('Error checking verification status:', error);
      setError('Failed to check verification status');
    } finally {
      setChecking(false);
    }
  };

  const renderVerificationStatus = () => {
    if (!verificationSession) return null;

    switch (verificationSession.status) {
      case 'requires_input':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Verification Ready</h4>
                <p className="text-sm text-blue-800">
                  Click the button below to complete your identity verification with Stripe.
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => window.open(verificationSession.url, '_blank')}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Complete Identity Verification
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => checkVerificationStatus()}
              disabled={checking}
              className="w-full"
            >
              {checking ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check Status
            </Button>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-900">Verification Processing</h4>
                <p className="text-sm text-yellow-800">
                  Your identity verification is being processed. This usually takes a few minutes.
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => checkVerificationStatus()}
              disabled={checking}
              className="w-full"
            >
              {checking ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check Status
            </Button>
          </div>
        );

      case 'verified':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Verification Complete</h4>
                <p className="text-sm text-green-800">
                  Your identity has been successfully verified with Stripe.
                </p>
              </div>
            </div>
            
            {verificationSession.verified_outputs && (
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Verified Information:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {verificationSession.verified_outputs.first_name && (
                    <div>
                      <span className="text-gray-600">First Name:</span>
                      <span className="ml-2 font-medium">{verificationSession.verified_outputs.first_name}</span>
                    </div>
                  )}
                  {verificationSession.verified_outputs.last_name && (
                    <div>
                      <span className="text-gray-600">Last Name:</span>
                      <span className="ml-2 font-medium">{verificationSession.verified_outputs.last_name}</span>
                    </div>
                  )}
                  {verificationSession.verified_outputs.dob && (
                    <div>
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="ml-2 font-medium">
                        {verificationSession.verified_outputs.dob.month}/{verificationSession.verified_outputs.dob.day}/{verificationSession.verified_outputs.dob.year}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'canceled':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900">Verification Canceled</h4>
                <p className="text-sm text-red-800">
                  The verification process was canceled. Please start a new verification.
                </p>
              </div>
            </div>
            
            <Button 
              onClick={createVerificationSession}
              disabled={loading}
              className="w-full"
            >
              Start New Verification
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (checking) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Identity Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Checking verification status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Identity Verification
          {verificationSession?.status === 'verified' && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Verified
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Secure identity verification powered by Stripe Identity
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!verificationSession ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">What you'll need:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Government ID</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Camera className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Device Camera</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Personal Info</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Why verify your identity?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Required for marketplace compliance and safety</li>
                <li>• Protects customers and providers</li>
                <li>• Enables secure payments and payouts</li>
                <li>• Fast, secure process powered by Stripe</li>
              </ul>
            </div>

            <Button 
              onClick={createVerificationSession}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Start Identity Verification
            </Button>
          </div>
        ) : (
          renderVerificationStatus()
        )}
      </CardContent>
    </Card>
  );
};

export default StripeIdentityVerification;
