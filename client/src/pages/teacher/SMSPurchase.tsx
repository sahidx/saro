import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Smartphone, Zap, Star, ChevronRight } from "lucide-react";

interface SMSPackage {
  id: string;
  name: string;
  smsCount: number;
  price: number;
  pricePerSMS: number;
  popular?: boolean;
  features: string[];
}

const smsPackages: SMSPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    smsCount: 100,
    price: 500,
    pricePerSMS: 5.0,
    features: ["100 SMS Credits", "Basic Support", "30 Days Validity"]
  },
  {
    id: "standard",
    name: "Standard Pack",
    smsCount: 500,
    price: 2000,
    pricePerSMS: 4.0,
    popular: true,
    features: ["500 SMS Credits", "Priority Support", "60 Days Validity", "10% Bonus Credits"]
  },
  {
    id: "premium",
    name: "Premium Pack",
    smsCount: 1000,
    price: 3500,
    pricePerSMS: 3.5,
    features: ["1000 SMS Credits", "Premium Support", "90 Days Validity", "20% Bonus Credits"]
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    smsCount: 5000,
    price: 15000,
    pricePerSMS: 3.0,
    features: ["5000 SMS Credits", "24/7 Support", "365 Days Validity", "30% Bonus Credits", "Custom Templates"]
  }
];

export default function SMSPurchase() {
  const [selectedPackage, setSelectedPackage] = useState<SMSPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [phoneNumber, setPhoneNumber] = useState("01734285995");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: async (data: {
      packageName: string;
      smsCount: number;
      price: number;
      paymentMethod: string;
      phoneNumber: string;
    }) => {
      return await apiRequest("POST", "/api/sms/purchase", data);
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Purchase Successful!",
        description: `${data?.message || 'SMS credits purchased successfully'}. Your SMS credits have been added to your account.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      setSelectedPackage(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Purchase Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    if (!selectedPackage) return;

    purchaseMutation.mutate({
      packageName: selectedPackage.name,
      smsCount: selectedPackage.smsCount,
      price: selectedPackage.price,
      paymentMethod,
      phoneNumber,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          SMS Package Purchase
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Choose the perfect SMS package for your coaching center communication needs
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* SMS Packages */}
        <div className="lg:col-span-2">
          <div className="grid md:grid-cols-2 gap-6">
            {smsPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedPackage?.id === pkg.id
                    ? "ring-2 ring-blue-500 shadow-lg"
                    : "hover:shadow-md"
                } ${pkg.popular ? "border-blue-500" : ""}`}
                onClick={() => setSelectedPackage(pkg)}
                data-testid={`card-sms-package-${pkg.id}`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-4 bg-blue-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    {pkg.name}
                    {selectedPackage?.id === pkg.id && (
                      <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Perfect for {pkg.smsCount < 500 ? "small centers" : pkg.smsCount < 1500 ? "medium centers" : "large institutions"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ৳{pkg.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ৳{pkg.pricePerSMS}/SMS • {pkg.smsCount} Credits
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Zap className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Purchase Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Complete Purchase
              </CardTitle>
              <CardDescription>
                Secure payment processing for your SMS credits
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {selectedPackage ? (
                <>
                  {/* Selected Package Summary */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      {selectedPackage.name}
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {selectedPackage.smsCount} SMS Credits
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      ৳{selectedPackage.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label className="text-base font-medium">Payment Method</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bkash" id="bkash" />
                        <Label htmlFor="bkash">bKash</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nagad" id="nagad" />
                        <Label htmlFor="nagad">Nagad</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rocket" id="rocket" />
                        <Label htmlFor="rocket">Rocket</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phone" className="text-base font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      className="mt-2"
                      data-testid="input-phone-number"
                    />
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={handlePurchase}
                    disabled={purchaseMutation.isPending}
                    className="w-full h-12 text-base"
                    data-testid="button-purchase-sms"
                  >
                    {purchaseMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                      </div>
                    ) : (
                      `Purchase ${selectedPackage.smsCount} SMS Credits`
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Secure payment processing. Your credits will be added instantly.
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a package to continue with your purchase
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
