import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const OnboardingPrompt = ({ userType = 'customer', onDismiss }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const customerSteps = [
    {
      icon: '👋',
      title: 'Welcome to ChillNet!',
      description: 'Let\'s get your account set up for the best ice cream delivery experience.',
      action: 'Get Started',
      link: null
    },
    {
      icon: '📍',
      title: 'Add Your Address',
      description: 'Add your delivery address so vendors can find you easily.',
      action: 'Add Address',
      link: '/customer/settings?tab=addresses'
    },
    {
      icon: '🍦',
      title: 'You\'re All Set!',
      description: 'Start exploring delicious ice cream from local vendors.',
      action: 'Start Shopping',
      link: '/customer'
    }
  ];

  const vendorSteps = [
    {
      icon: '🏪',
      title: 'Welcome, Vendor!',
      description: 'Let\'s set up your store to start selling delicious ice cream.',
      action: 'Get Started',
      link: null
    },
    {
      icon: '📍',
      title: 'Add Store Address',
      description: 'Add your store location so customers can find you.',
      action: 'Add Address',
      link: '/vendor/settings?tab=addresses'
    },
    {
      icon: '📦',
      title: 'Add Products',
      description: 'Upload your ice cream products and start selling.',
      action: 'Add Products',
      link: '/vendor/products'
    },
    {
      icon: '✅',
      title: 'Store Ready!',
      description: 'Your store is ready to receive orders from customers.',
      action: 'Go to Dashboard',
      link: '/vendor'
    }
  ];

  const steps = userType === 'vendor' ? vendorSteps : customerSteps;
  const step = steps[currentStep];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const skipOnboarding = () => {
    if (onDismiss) onDismiss();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative">
        {/* Skip Button */}
        <button
          onClick={skipOnboarding}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2 mb-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="mb-8">
          <div className="text-6xl mb-4">{step.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>
          <p className="text-gray-600 leading-relaxed">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {step.link ? (
            <Link
              to={step.link}
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={onDismiss}
            >
              {step.action}
            </Link>
          ) : (
            <button
              onClick={nextStep}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {step.action}
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={skipOnboarding}
              className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
          ) : (
            <button
              onClick={skipOnboarding}
              className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors"
            >
              Maybe later
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPrompt;
