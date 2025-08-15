import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import PaymentForm from '../components/PaymentForm';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending');

  // Extract payment parameters from URL
  const bookingId = searchParams.get('booking_id');
  const totalAmount = parseFloat(searchParams.get('total_amount') || '0');
  const serviceFee = parseFloat(searchParams.get('service_fee') || '0');
  const customerEmail = searchParams.get('customer_email') || '';
  const customerName = searchParams.get('customer_name') || '';
  const businessName = searchParams.get('business_name') || '';
  const serviceName = searchParams.get('service_name') || '';
  const promoCode = searchParams.get('promo_code');
  const discountAmount = parseFloat(searchParams.get('discount_amount') || '0');

  // Validate required parameters
  useEffect(() => {
    if (!bookingId || !totalAmount || !customerEmail) {
      toast({
        title: 'Invalid Payment Request',
        description: 'Missing required payment information. Redirecting...',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/'), 3000);
    }
  }, [bookingId, totalAmount, customerEmail, navigate, toast]);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentStatus('success');
    
    // Redirect to success page after a short delay
    setTimeout(() => {
      navigate(`/booking-success?booking_id=${bookingId}&payment_intent=${paymentIntentId}`);
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    console.error('Payment error:', error);
  };

  const handleBackToBooking = () => {
    navigate(-1); // Go back to previous page
  };

  if (!bookingId || !totalAmount || !customerEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Payment Request</h2>
            <p className="text-gray-600 mb-4">
              Missing required payment information. You will be redirected shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your booking has been confirmed and payment processed successfully.
            </p>
            <p className="text-sm text-gray-500">Redirecting to confirmation page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToBooking}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Booking
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600 mt-1">
            Secure payment for your booking at {businessName}
          </p>
        </div>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Service:</span>
              <span>{serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Business:</span>
              <span>{businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Customer:</span>
              <span>{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span>{customerEmail}</span>
            </div>
            {promoCode && (
              <div className="flex justify-between text-green-600">
                <span className="font-medium">Promo Code:</span>
                <span>{promoCode} (-${discountAmount.toFixed(2)})</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        {paymentStatus === 'pending' && (
          <PaymentForm
            bookingId={bookingId}
            totalAmount={totalAmount}
            serviceFee={serviceFee}
            customerEmail={customerEmail}
            customerName={customerName}
            businessName={businessName}
            serviceName={serviceName}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        )}

        {paymentStatus === 'error' && (
          <Card>
            <CardContent className="text-center p-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-4">
                There was an issue processing your payment. Please try again.
              </p>
              <Button onClick={() => setPaymentStatus('pending')}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Payment;
