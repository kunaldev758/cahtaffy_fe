"use client"
import React, { useState } from 'react';
import { MessageCircle, Users, Bot, Zap, Shield, BarChart3, Check, ArrowRight, Mail, Phone, MapPin, Menu, X } from 'lucide-react';

const ChataffyWebsite = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  // Theme configurations - easily customizable
  const themes:any = {
    blue: {
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      primaryText: 'text-blue-600',
      gradient: 'from-blue-600 to-purple-600',
      accent: 'bg-blue-100',
      accentText: 'text-blue-800'
    },
    green: {
      primary: 'bg-green-600',
      primaryHover: 'hover:bg-green-700',
      primaryText: 'text-green-600',
      gradient: 'from-green-600 to-teal-600',
      accent: 'bg-green-100',
      accentText: 'text-green-800'
    },
    purple: {
      primary: 'bg-purple-600',
      primaryHover: 'hover:bg-purple-700',
      primaryText: 'text-purple-600',
      gradient: 'from-purple-600 to-pink-600',
      accent: 'bg-purple-100',
      accentText: 'text-purple-800'
    },
    red: {
      primary: 'bg-red-600',
      primaryHover: 'hover:bg-red-700',
      primaryText: 'text-red-600',
      gradient: 'from-red-600 to-orange-600',
      accent: 'bg-red-100',
      accentText: 'text-red-800'
    }
  };

  const theme = themes[currentTheme];

  const handleFormSubmit = (e:any) => {
    // Handle form submission logic here
    console.log('Form submitted:', formData);
    alert('Thank you for your inquiry! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  const handleInputChange = (e:any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const scrollToSection = (sectionId:any) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "AI-Powered Chat",
      description: "Intelligent bot handles customer queries 24/7 with natural language processing and smart responses."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Panel System",
      description: "Separate panels for visitors, clients, and agents with seamless role-based access control."
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Human Handoff",
      description: "Agents can instantly take over conversations by switching off AI mode for personalized support."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-time Communication",
      description: "Socket-based architecture ensures instant message delivery and live conversation updates."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with encrypted communications and reliable uptime."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analytics Dashboard",
      description: "Track customer interactions, response times, and satisfaction metrics in real-time."
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small businesses",
      features: [
        "Up to 1,000 monthly conversations",
        "Basic AI responses",
        "2 agent seats",
        "Email support",
        "Basic analytics"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month",
      description: "Ideal for growing companies",
      features: [
        "Up to 10,000 monthly conversations",
        "Advanced AI with custom training",
        "10 agent seats",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
        "API access"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Unlimited conversations",
        "Custom AI model training",
        "Unlimited agent seats",
        "24/7 dedicated support",
        "White-label solution",
        "Custom integrations",
        "On-premise deployment"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Theme Switcher - For demo purposes */}
      <div className="fixed top-4 right-4 z-50 bg-white p-2 rounded-lg shadow-lg">
        <div className="flex gap-2">
          {Object.keys(themes).map((themeKey) => (
            <button
              key={themeKey}
              className={`w-6 h-6 rounded-full ${themes[themeKey].primary} ${
                currentTheme === themeKey ? 'ring-2 ring-gray-400' : ''
              }`}
              onClick={() => setCurrentTheme(themeKey)}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageCircle className={`w-8 h-8 ${theme.primaryText}`} />
              <span className="ml-2 text-2xl font-bold text-gray-900">Chataffy</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-gray-900">Home</button>
              <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-gray-900">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-700 hover:text-gray-900">Pricing</button>
              <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-gray-900">About</button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-gray-900">Contact</button>
              <button 
                onClick={() => window.location.href = process.env.NEXT_PUBLIC_APP_URL+'signup'} 
                className={`${theme.primary} ${theme.primaryHover} text-white px-4 py-2 rounded-lg transition-colors`}
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-gray-900"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button onClick={() => scrollToSection('home')} className="block px-3 py-2 text-gray-700">Home</button>
              <button onClick={() => scrollToSection('features')} className="block px-3 py-2 text-gray-700">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="block px-3 py-2 text-gray-700">Pricing</button>
              <button onClick={() => scrollToSection('about')} className="block px-3 py-2 text-gray-700">About</button>
              <button onClick={() => scrollToSection('contact')} className="block px-3 py-2 text-gray-700">Contact</button>
              <button className={`${theme.primary} text-white px-4 py-2 rounded-lg ml-3 mt-2`}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className={`bg-gradient-to-br ${theme.gradient} text-white py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Customer Service with
              <span className="block text-yellow-300">Chataffy AI</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Intelligent AI chatbot with seamless human handoff. Engage visitors, manage clients, and empower agents - all in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Start Free Trial
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Chataffy?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform combines AI automation with human expertise to deliver exceptional customer experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className={`${theme.accent} ${theme.accentText} w-16 h-16 rounded-lg flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Chataffy Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple setup, powerful results. Get your AI customer service running in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className={`${theme.primary} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold`}>
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Setup Your Bot</h3>
              <p className="text-gray-600">Configure your AI chatbot with custom responses and train it on your business knowledge.</p>
            </div>
            <div className="text-center">
              <div className={`${theme.primary} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold`}>
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Engage Visitors</h3>
              <p className="text-gray-600">AI handles initial customer queries automatically, providing instant responses 24/7.</p>
            </div>
            <div className="text-center">
              <div className={`${theme.primary} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold`}>
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Human Handoff</h3>
              <p className="text-gray-600">Agents can seamlessly take over conversations when human expertise is needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan for your business. All plans include core features with no hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-blue-500 relative' : ''}`}>
                {plan.popular && (
                  <div className={`${theme.primary} text-white text-center py-2 text-sm font-semibold`}>
                    Most Popular
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full ${plan.popular ? theme.primary : 'bg-gray-200'} ${plan.popular ? 'text-white' : 'text-gray-700'} py-3 px-6 rounded-lg font-semibold ${plan.popular ? theme.primaryHover : 'hover:bg-gray-300'} transition-colors`}>
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                About Chataffy
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Chataffy is a cutting-edge customer service platform that bridges the gap between AI automation and human expertise. Our mission is to help businesses provide exceptional customer support while reducing costs and improving efficiency.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Built with modern socket technology, our platform ensures real-time communication between visitors, clients, and agents. The seamless AI-to-human handoff capability makes sure customers always get the right level of support they need.
              </p>
              <div className="flex items-center">
                <ArrowRight className={`w-5 h-5 ${theme.primaryText} mr-2`} />
                <span className={`${theme.primaryText} font-semibold`}>Join thousands of satisfied customers</span>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">50K+</div>
                  <div className="text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">99.9%</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">2M+</div>
                  <div className="text-gray-600">Messages/Month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-gray-600">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to transform your customer service? Contact us today for a personalized demo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className={`${theme.accent} ${theme.accentText} p-3 rounded-lg mr-4`}>
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">hello@chataffy.com</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`${theme.accent} ${theme.accentText} p-3 rounded-lg mr-4`}>
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Phone</div>
                    <div className="text-gray-600">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`${theme.accent} ${theme.accentText} p-3 rounded-lg mr-4`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Address</div>
                    <div className="text-gray-600">123 Tech Street, Silicon Valley, CA 94105</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Send us a message</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleFormSubmit}
                    className={`w-full ${theme.primary} ${theme.primaryHover} text-white py-3 px-6 rounded-lg font-semibold transition-colors`}
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <MessageCircle className="w-8 h-8 text-blue-400" />
                <span className="ml-2 text-2xl font-bold">Chataffy</span>
              </div>
              <p className="text-gray-400">
                Transforming customer service with intelligent AI and seamless human collaboration.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Chataffy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChataffyWebsite;