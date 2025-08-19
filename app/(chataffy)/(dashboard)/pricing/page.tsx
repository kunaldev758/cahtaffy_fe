'use client'
import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, Shield, CreditCard, Clock, Star } from 'lucide-react';
import {createOrder,capturePayment} from '../../../_api/dashboard/action';
import { getPlans } from '../../../_api/dashboard/action';

// Checkout Page Component
const CheckoutPage = ({ selectedPlan, billingCycle = 'monthly', onBack, onSuccess, onError }:any) => {
  const [loading, setLoading] = useState<any>(false);
  const [paypalLoaded, setPaypalLoaded] = useState<any>(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const getPrice = () => {
    return billingCycle === 'monthly' ? selectedPlan.pricing.monthly : selectedPlan.pricing.yearly;
  };

  const getSavings = () => {
    if (billingCycle === 'yearly' && selectedPlan.pricing.yearly > 0) {
      const monthlyTotal = selectedPlan.pricing.monthly * 12;
      const savings = monthlyTotal - selectedPlan.pricing.yearly;
      return Math.round((savings / monthlyTotal) * 100);
    }
    return 0;
  };

  // Load PayPal SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).paypal) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID'}&currency=USD&intent=capture`;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => setError('Failed to load PayPal SDK');
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Render PayPal buttons when SDK is loaded
  useEffect(() => {
    if (!paypalLoaded || !(window as any).paypal) return;

    const price = getPrice();
    if (price === 0) {
      // Handle free plan
      handleFreePlan();
      return;
    }

    (window as any).paypal.Buttons({
      createOrder: async () => {
        try {
          setLoading(true);
          const data= await createOrder(price.toString(),selectedPlan.pricing.currency,selectedPlan.name,billingCycle);
          setOrderData(data);
          return data.id;
        } catch (err:any) {
          setError(err.message);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      
      onApprove: async (data:any) => {
        try {
          setLoading(true);
          // Here you would typically capture the payment on your backend
          const result= await capturePayment(data.orderID,selectedPlan,billingCycle)
          onSuccess && onSuccess(result);
        } catch (err:any) {
          setError(err.message);
          onError && onError(err.message);
        } finally {
          setLoading(false);
        }
      },
      
      onError: (err:any) => {
        setError('Payment failed. Please try again.');
        onError && onError(err);
      },
      
      onCancel: () => {
        setError('Payment was cancelled.');
      }
    }).render('#paypal-button-container');
  }, [paypalLoaded, selectedPlan, billingCycle]);

  const handleFreePlan = () => {
    // For free plan, just proceed without payment
    onSuccess && onSuccess({ plan: selectedPlan, amount: 0 });
  };

  const formatBytes = (bytes:any) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num:any) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 w-full">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to pricing
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
            <p className="text-gray-600">You're just one step away from upgrading your chatbot experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="border rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedPlan.displayName}</h3>
                  <p className="text-gray-600 mt-1">{selectedPlan.description}</p>
                </div>
                {selectedPlan.metadata.popular && (
                  <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <Star className="w-4 h-4 mr-1" />
                    Popular
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Billing cycle:</span>
                  <span className="font-medium">{billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                </div>
                {selectedPlan.metadata.trial.enabled && (
                  <div className="flex justify-between items-center">
                    <span>Free trial:</span>
                    <div className="flex items-center text-green-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedPlan.metadata.trial.days} days
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-gray-600">Total:</span>
                    {getSavings() > 0 && (
                      <div className="text-sm text-green-600">
                        Save {getSavings()}% with yearly billing
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      ${getPrice()}
                      <span className="text-lg text-gray-600 font-normal">
                        {billingCycle === 'monthly' ? '/month' : '/year'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-3">What you'll get:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  <span>{formatNumber(selectedPlan.limits.maxQueries)} queries/month</span>
                </div>
                {/* <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  <span>{formatNumber(selectedPlan.limits.maxPages)} pages</span>
                </div> */}
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  <span>{formatBytes(selectedPlan.limits.maxStorage)} storage</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  <span>{selectedPlan.limits.maxAgentsPerAccount} agent{selectedPlan.limits.maxAgentsPerAccount !== 1 ? 's' : ''}</span>
                </div>
                {/* {selectedPlan.features.apiAccess && (
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span>API Access</span>
                  </div>
                )}
                {selectedPlan.features.analytics && (
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span>Analytics</span>
                  </div>
                )} */}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Payment Details</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-red-800">
                  <div className="text-red-500 mr-3">⚠️</div>
                  <div>
                    <h4 className="font-medium">Payment Error</h4>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security badges */}
            <div className="flex items-center justify-center space-x-6 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-5 h-5 mr-2 text-green-500" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                <span>PayPal Secure</span>
              </div>
            </div>

            {/* PayPal Button Container */}
            {getPrice() === 0 ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Free Plan Selected!</h3>
                  <p className="text-green-700 text-sm mb-4">
                    No payment required. Click below to activate your free plan.
                  </p>
                </div>
                <button
                  onClick={handleFreePlan}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  Activate Free Plan
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Pay with PayPal</h3>
                  <p className="text-sm text-gray-600">
                    Secure payment powered by PayPal. You can pay with your PayPal account or credit card.
                  </p>
                </div>
                
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-gray-600">Processing...</span>
                  </div>
                )}
                
                <div id="paypal-button-container" className={loading ? 'opacity-50 pointer-events-none' : ''}></div>
              </div>
            )}

            {/* Terms */}
            <div className="mt-6 pt-6 border-t text-xs text-gray-500 text-center">
              <p>
                By completing your purchase, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
              </p>
              {selectedPlan.metadata.trial.enabled && (
                <p className="mt-2">
                  Your {selectedPlan.metadata.trial.days}-day free trial starts today. 
                  You won't be charged until the trial period ends.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success Page Component
const PaymentSuccess = ({ paymentData, onContinue }: any) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-8 w-full">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your {paymentData?.plan?.displayName || 'plan'} is now active.
          </p>
          
          {paymentData?.plan?.metadata?.trial?.enabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Your {paymentData.plan.metadata.trial.days}-day free trial has started. 
                You can start using all features immediately.
              </p>
            </div>
          )}
          
          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium">{paymentData?.plan?.displayName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">${paymentData?.amount || '0'}</span>
            </div>
          </div>
          
          <button
            onClick={onContinue}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component that handles the flow
const PaymentFlow = () => {
  const [currentStep, setCurrentStep] = useState<any>('pricing'); // pricing, checkout, success
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<any>('monthly');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [plans, setPlans] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // const response = await fetch('http://localhost:9000/api/available');
        // const data = await response.json();
        const data = await getPlans()
        if (data.success) {
          setPlans(data.data);
        } else {
          setError('Failed to fetch pricing plans');
        }
      } catch (err) {
        setError('Error loading pricing plans');
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanSelect = (plan:any, cycle:any) => {
    setSelectedPlan(plan);
    setBillingCycle(cycle);
    setCurrentStep('checkout');
  };

  const handlePaymentSuccess = (data:any) => {
    setPaymentData(data);
    setCurrentStep('success');
  };

  const handlePaymentError = (error:any) => {
    console.error('Payment error:', error);
    // Handle payment error - could show error message or redirect
  };

  const handleBackToPricing = () => {
    setCurrentStep('pricing');
    setSelectedPlan(null);
    setPaymentData(null);
  };

  const handleContinueToDashboard = () => {
    // Redirect to dashboard or wherever you want
    window.location.href = '/dashboard';
  };

  // Updated Pricing Page with checkout integration
  const PricingPageWithCheckout = () => {
    const formatBytes = (bytes:any) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatNumber = (num:any) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toString();
    };

    // const getPrice = (plan) => {
    //   return billingCycle === 'monthly' ? plan.pricing.monthly : plan.pricing.yearly;
    // };

    const getMonthlyPrice = (plan:any) => {
      if (billingCycle === 'monthly') return plan.pricing.monthly;
      return Math.round(plan.pricing.yearly / 12);
    };

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pricing plans...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 w-full">
        {/* Header */}
        <div className="text-center py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Choose Your AI Chatbot Plan
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Scale your customer support with our intelligent chatbot solution. 
              Perfect for businesses of all sizes.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <div className="bg-white rounded-full p-1 shadow-lg">
                <div className="flex">
                  <button
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                      billingCycle === 'monthly'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                      billingCycle === 'yearly'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setBillingCycle('yearly')}
                  >
                    Yearly
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Save 17%
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan:any) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  plan.metadata.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.metadata.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-bl-lg">
                    <div className="flex items-center text-sm font-medium">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card Header */}
                <div className="p-8 pb-6">
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: plan.metadata.color }}
                    ></div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {plan.displayName}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6 h-12">
                    {plan.description}
                  </p>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        ${getMonthlyPrice(plan)}
                      </span>
                      <span className="text-gray-600 ml-2">/month</span>
                    </div>
                    {billingCycle === 'yearly' && plan.pricing.yearly > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Billed yearly (${plan.pricing.yearly})
                      </p>
                    )}
                    {plan.metadata.trial.enabled && (
                      <div className="flex items-center mt-2 text-sm text-blue-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {plan.metadata.trial.days}-day free trial
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button 
                    onClick={() => handlePlanSelect(plan, billingCycle)}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                      plan.metadata.popular
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.pricing.monthly === 0 ? 'Get Started Free' : 'Select Plan'}
                  </button>
                </div>

                {/* Features */}
                <div className="px-8 pb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Features included:</h4>
                  <ul className="space-y-3">
                    {/* Core Limits */}
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {formatNumber(plan.limits.maxQueries)} queries/month
                      </span>
                    </li>
                    {/* <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {formatNumber(plan.limits.maxPages)} pages
                      </span>
                    </li> */}
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {formatBytes(plan.limits.maxStorage)} storage
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {plan.limits.maxAgentsPerAccount} agent{plan.limits.maxAgentsPerAccount !== 1 ? 's' : ''}
                      </span>
                    </li>

                    {/* Advanced Features */}
                    {/* {plan.features.apiAccess && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600">API Access</span>
                      </li>
                    )}
                    {plan.features.analytics && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Analytics Dashboard</span>
                      </li>
                    )}
                    {plan.features.prioritySupport && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Priority Support</span>
                      </li>
                    )}
                    {plan.features.customIntegrations && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Custom Integrations</span>
                      </li>
                    )}
                    {plan.features.whiteLabel && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600">White Label</span>
                      </li>
                    )} */}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render current step
  switch (currentStep) {
    case 'checkout':
      return (
        <CheckoutPage
          selectedPlan={selectedPlan}
          billingCycle={billingCycle}
          onBack={handleBackToPricing}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      );
    case 'success':
      return (
        <PaymentSuccess
          paymentData={paymentData}
          onContinue={handleContinueToDashboard}
        />
      );
    default:
      return <PricingPageWithCheckout />;
  }
};

export default PaymentFlow;