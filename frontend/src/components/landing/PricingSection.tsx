/**
 * Pricing Section - Highlight free tier
 */

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/app.config';

const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free Forever',
      price: '$0',
      period: 'forever',
      description: 'Everything you need to ace interviews',
      features: [
        'Unlimited mock interviews',
        'AI-powered feedback',
        'Resume analysis',
        'Progress tracking',
        'Company intelligence',
        'Achievement system',
        'Streak tracking',
        'Analytics dashboard',
      ],
      cta: 'Start Free',
      popular: true,
      gradient: 'from-blue-600 to-indigo-600',
    },
  ];

  return (
    <section id="pricing" ref={ref} className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need, completely free forever
          </p>
        </motion.div>

        <div className="flex justify-center">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative max-w-md w-full"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className={`bg-white rounded-3xl p-8 shadow-2xl border-2 ${
                plan.popular ? 'border-blue-500' : 'border-gray-200'
              }`}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all ${
                    plan.popular
                      ? `bg-gradient-to-r ${plan.gradient} text-white`
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center text-gray-600"
        >
          <p className="text-lg">
            🎉 No credit card required • 🚀 Start in 30 seconds • 🔒 Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
