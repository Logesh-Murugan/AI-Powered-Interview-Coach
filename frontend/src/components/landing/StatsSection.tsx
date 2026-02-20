/**
 * Stats Section - Animated counters
 */

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import CountUp from 'react-countup';

const StatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const stats = [
    { number: 10000, suffix: '+', label: 'Users Prepared', duration: 2 },
    { number: 95, suffix: '%', label: 'Success Rate', duration: 2.5 },
    { number: 500000, suffix: '+', label: 'Mock Interviews', duration: 3 },
    { number: 100, suffix: '%', label: 'Free Forever', duration: 2 },
  ];

  return (
    <section ref={ref} className="py-20 px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                {isInView && (
                  <CountUp
                    end={stat.number}
                    duration={stat.duration}
                    separator=","
                    suffix={stat.suffix}
                  />
                )}
              </div>
              <div className="text-lg text-blue-100">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
