import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  CheckCircle,
  Calendar,
  MapPin,
  CreditCard,
  Home,
  FileText,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const BookingSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isCustomer } = useAuth();
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  const bookingId = searchParams.get("booking_id");
  const paymentIntentId = searchParams.get("payment_intent");

  useEffect(() => {
    // In a real app, you might fetch booking details from the API
    // For now, we'll show a success message with the available info
    if (bookingId) {
      setBookingDetails({
        id: bookingId,
        paymentIntentId: paymentIntentId,
        status: "confirmed",
      });
    }
  }, [bookingId, paymentIntentId]);

  const handleViewBookings = () => {
    if (isCustomer) {
      navigate("/customer/bookings");
    } else {
      navigate("/");
    }
  };

  const handleGoHome = () => {
    navigate("/home");
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="text-red-500 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find the booking information you're looking for.
            </p>
            <Button onClick={handleGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Header */}
        <Card className="mb-6">
          <CardContent className="text-center p-8">
            <div className="text-green-500 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600 mb-4">
              Your payment has been processed successfully and your booking is
              confirmed.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Booking ID:</strong> {bookingId}
              </p>
              {paymentIntentId && (
                <p className="text-sm text-green-800 mt-1">
                  <strong>Payment ID:</strong> {paymentIntentId}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Confirmation Email</h3>
                <p className="text-gray-600 text-sm">
                  You'll receive a confirmation email with all booking details
                  shortly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Provider Contact</h3>
                <p className="text-gray-600 text-sm">
                  The service provider will contact you within 24 hours to
                  confirm details and schedule.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Service Delivery</h3>
                <p className="text-gray-600 text-sm">
                  Enjoy your service at the scheduled time and location.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className="text-green-600 font-semibold">✓ Paid</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">Payment Method:</span>
                <span className="text-gray-900">Credit Card</span>
              </div>
              {paymentIntentId && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="text-gray-900 font-mono text-sm">
                    {paymentIntentId.substring(0, 20)}...
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleViewBookings} className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            View My Bookings
          </Button>
          <Button variant="outline" onClick={handleGoHome} className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Support Information */}
        <Card className="mt-6">
          <CardContent className="text-center p-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-4">
              If you have any questions about your booking, please don't
              hesitate to contact us.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/support")}
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingSuccess;
