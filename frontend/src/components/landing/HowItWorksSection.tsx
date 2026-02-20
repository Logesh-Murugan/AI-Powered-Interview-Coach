/**
 * How It Works Section - Step-by-step process
 */

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const steps = [
    {
      number: '01',
      title: 'Upload Your Resume',
      description: 'Our AI analyzes your background, skills, and experience to personalize your prep',
      icon: '📄',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      number: '02',
      title: 'Practice with AI Coach',
      description: 'Get tailored questions based on your target role with real-time feedback',
      icon: '💬',
      color: 'from-purple-500 to-pink-500',
    },
    {
      number: '03',
      title: 'Land Your Dream Job',
      description: 'Track progress, identify weak spots, and watch your confidence soar',
      icon: '🎯',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Get started in three simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection Lines */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 -translate-y-1/2" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-blue-500 relative z-10">
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {step.number}
                </div>
                
                <div className="text-5xl mb-4 text-center mt-4">
                  {step.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 text-center leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
