import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Mock business data for testing
const mockBusiness = {
  id: 'test-business-123',
  business_name: 'Test Business',
};

const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
};

export default function PlaidTest() {
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [plaidError, setPlaidError] = useState<string>('');
  const [plaidSuccess, setPlaidSuccess] = useState<string>('');
  const [testResults, setTestResults] = useState<any[]>([]);

  // Test Plaid Link Token Creation
  const testCreateLinkToken = async () => {
    setPlaidLoading(true);
    setPlaidError('');
    setPlaidSuccess('');

    try {
      const requestBody = {
        business_id: mockBusiness.id,
        user_id: mockUser.id,
        business_name: mockBusiness.business_name,
      };

      console.log('Testing Plaid create-link-token endpoint:', requestBody);

      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Mock authorization header for testing
          Authorization: `Bearer test-token-123`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('Plaid API Response:', response.status, responseText);

      if (!response.ok) {
        const errorData = responseText ? JSON.parse(responseText) : {};
        setPlaidError(`API Error (${response.status}): ${errorData.error || response.statusText}`);
        
        setTestResults(prev => [...prev, {
          test: 'Create Link Token',
          status: 'failed',
          error: `${response.status}: ${errorData.error || response.statusText}`,
          timestamp: new Date().toISOString()
        }]);
        return;
      }

      const data = JSON.parse(responseText);
      setPlaidLinkToken(data.link_token);
      setPlaidSuccess('Plaid Link token created successfully!');
      
      setTestResults(prev => [...prev, {
        test: 'Create Link Token',
        status: 'success',
        data: { link_token: data.link_token?.substring(0, 20) + '...', request_id: data.request_id },
        timestamp: new Date().toISOString()
      }]);

    } catch (error: any) {
      console.error('Error testing Plaid link token:', error);
      setPlaidError(error.message || 'Failed to test Plaid integration');
      
      setTestResults(prev => [...prev, {
        test: 'Create Link Token',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setPlaidLoading(false);
    }
  };

  // Test Plaid Token Exchange
  const testExchangeToken = async () => {
    setPlaidLoading(true);
    setPlaidError('');
    setPlaidSuccess('');

    try {
      const requestBody = {
        public_token: 'public-sandbox-test-token',
        business_id: mockBusiness.id,
        account_id: 'test-account-123',
        institution: {
          name: 'Test Bank',
          institution_id: 'ins_test'
        }
      };

      console.log('Testing Plaid exchange-token endpoint:', requestBody);

      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-token-123`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('Plaid Exchange Response:', response.status, responseText);

      if (!response.ok) {
        const errorData = responseText ? JSON.parse(responseText) : {};
        setPlaidError(`Exchange Error (${response.status}): ${errorData.error || response.statusText}`);
        
        setTestResults(prev => [...prev, {
          test: 'Exchange Token',
          status: 'failed',
          error: `${response.status}: ${errorData.error || response.statusText}`,
          timestamp: new Date().toISOString()
        }]);
        return;
      }

      const data = JSON.parse(responseText);
      setPlaidSuccess('Plaid token exchange test completed!');
      
      setTestResults(prev => [...prev, {
        test: 'Exchange Token',
        status: 'success',
        data: { success: data.success, message: data.message },
        timestamp: new Date().toISOString()
      }]);

    } catch (error: any) {
      console.error('Error testing Plaid token exchange:', error);
      setPlaidError(error.message || 'Failed to test token exchange');
      
      setTestResults(prev => [...prev, {
        test: 'Exchange Token',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setPlaidLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setPlaidError('');
    setPlaidSuccess('');
    setPlaidLinkToken(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Plaid Integration Test
        </h1>
        <p className="text-gray-600">
          Test the migrated Plaid integration endpoints without authentication dependencies.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Plaid API Tests</CardTitle>
            <CardDescription>
              Test the Vercel Edge Functions for Plaid integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={testCreateLinkToken}
                disabled={plaidLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {plaidLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Test Create Link Token
              </Button>
              
              <Button
                onClick={testExchangeToken}
                disabled={plaidLoading}
                variant="outline"
              >
                {plaidLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Test Exchange Token
              </Button>
              
              <Button
                onClick={clearResults}
                variant="outline"
                className="ml-auto"
              >
                Clear Results
              </Button>
            </div>

            {/* Status Messages */}
            {plaidError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{plaidError}</AlertDescription>
              </Alert>
            )}

            {plaidSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{plaidSuccess}</AlertDescription>
              </Alert>
            )}

            {plaidLinkToken && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Link Token: {plaidLinkToken.substring(0, 50)}...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Results from Plaid API endpoint tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                        )}
                        {result.test}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {result.error && (
                      <p className="text-red-700 text-sm mb-2">
                        Error: {result.error}
                      </p>
                    )}
                    
                    {result.data && (
                      <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mock Data Info */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Mock data being used for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Mock Business</h4>
                <pre className="text-sm bg-gray-100 p-2 rounded">
                  {JSON.stringify(mockBusiness, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Mock User</h4>
                <pre className="text-sm bg-gray-100 p-2 rounded">
                  {JSON.stringify(mockUser, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
