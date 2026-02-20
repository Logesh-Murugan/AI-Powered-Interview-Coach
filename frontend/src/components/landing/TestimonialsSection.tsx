/**
 * Testimonials Section - Auto-rotating carousel
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      quote: "InterviewMaster AI helped me land my dream job at Google. The personalized questions based on my resume were exactly what I needed.",
      author: "Sarah Chen",
      role: "Software Engineer at Google",
      avatar: "👩‍💻",
      rating: 5,
    },
    {
      quote: "The AI feedback is incredibly detailed and actionable. It's like having a personal interview coach available 24/7 for free.",
      author: "Marcus Johnson",
      role: "Product Manager at Meta",
      avatar: "👨‍💼",
      rating: 5,
    },
    {
      quote: "I went from failing interviews to getting multiple offers. The company-specific intelligence feature was a game changer.",
      author: "Priya Sharma",
      role: "Data Scientist at Amazon",
      avatar: "👩‍🔬",
      rating: 5,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section id="testimonials" className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-gray-600">
            Hear from users who landed their dream jobs
          </p>
        </motion.div>

        <div className="relative h-96 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-12 shadow-xl border-2 border-blue-200 h-full flex flex-col justify-center">
                <div className="text-6xl mb-6 text-center">
                  {testimonials[currentIndex].avatar}
                </div>
                
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-xl text-gray-700 italic mb-6 text-center leading-relaxed">
                  "{testimonials[currentIndex].quote}"
                </p>
                
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-900">
                    {testimonials[currentIndex].author}
                  </div>
                  <div className="text-gray-600">
                    {testimonials[currentIndex].role}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-blue-600 w-8"
                  : "bg-gray-300 w-2"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
