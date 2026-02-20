/**
 * Features Section - Bento Grid Layout
 */

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: '🎯',
      title: 'Resume-Aware AI',
      description: 'Questions tailored to YOUR experience and skill gaps',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '🤖',
      title: 'Hybrid Intelligence',
      description: 'Fast traditional AI + deep agent analysis',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Multi-dimensional analytics with adaptive difficulty',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: '🏢',
      title: 'Company Intel',
      description: 'Real questions from Google, Meta, Amazon & more',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: '🎮',
      title: 'Gamification',
      description: 'Achievements, streaks, and skill trees',
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: '💰',
      title: '100% Free',
      description: 'Unlimited practice with zero cost forever',
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  return (
    <section id="features" ref={ref} className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Ace Interviews
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to transform your interview preparation
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-200 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              <motion.div
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-5xl mb-4 inline-block"
              >
                {feature.icon}
              </motion.div>
              
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
