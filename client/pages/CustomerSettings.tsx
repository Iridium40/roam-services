import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Settings,
  Bell,
  CreditCard,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Save,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomerSettings() {
  const { customer } = useAuth();
  const [settings, setSettings] = useState({
    // Notification Preferences
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingReminders: true,
    promotionalEmails: false,
    serviceUpdates: true,

    // App Preferences

    // Communication Preferences
    preferredContactMethod: "email",
  });

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg">Please sign in to view your settings.</p>
          <Button asChild className="mt-4 bg-roam-blue hover:bg-roam-blue/90">
            <Link to="/">Go Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    // TODO: Implement settings save API call
    console.log("Saving settings:", settings);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM Logo"
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Content */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  <span className="text-roam-blue">Settings</span>
                </h1>
                <p className="text-lg text-foreground/70">
                  Customize your ROAM experience and manage your preferences.
                </p>
              </div>
              <Button
                onClick={handleSave}
                className="bg-roam-blue hover:bg-roam-blue/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-foreground/60">
                          Receive booking confirmations and updates via email
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) =>
                          updateSetting("emailNotifications", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-foreground/60">
                          Get text message alerts for important updates
                        </p>
                      </div>
                      <Switch
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) =>
                          updateSetting("smsNotifications", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-foreground/60">
                          Receive push notifications on your device
                        </p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) =>
                          updateSetting("pushNotifications", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Booking Reminders</Label>
                        <p className="text-sm text-foreground/60">
                          Get reminded about upcoming appointments
                        </p>
                      </div>
                      <Switch
                        checked={settings.bookingReminders}
                        onCheckedChange={(checked) =>
                          updateSetting("bookingReminders", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Promotional Emails</Label>
                        <p className="text-sm text-foreground/60">
                          Receive offers and promotional content
                        </p>
                      </div>
                      <Switch
                        checked={settings.promotionalEmails}
                        onCheckedChange={(checked) =>
                          updateSetting("promotionalEmails", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Service Updates</Label>
                        <p className="text-sm text-foreground/60">
                          Get notified about new services and features
                        </p>
                      </div>
                      <Switch
                        checked={settings.serviceUpdates}
                        onCheckedChange={(checked) =>
                          updateSetting("serviceUpdates", checked)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Communication Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Communication Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Preferred Contact Method</Label>
                    <Select
                      value={settings.preferredContactMethod}
                      onValueChange={(value) =>
                        updateSetting("preferredContactMethod", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="sms">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            SMS
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <Smartphone className="w-4 h-4" />
                            Both Email & SMS
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
