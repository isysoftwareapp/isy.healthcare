/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'framer-motion';

const FluidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#ffffff]">
      {/* Background Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f0f9ff] to-[#e6f7ff] opacity-80" />

      {/* Primary Organic Blob (Light Blue) */}
      <motion.div
        className="absolute top-[-10%] right-[-5%] w-[80vw] h-[80vw] bg-[#ADE8F4] rounded-full mix-blend-multiply filter blur-[120px] opacity-40"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 45, 0],
          x: [0, 100, 0],
          y: [0, -50, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Secondary Organic Blob (Medium Blue) */}
      <motion.div
        className="absolute bottom-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-[#498FB3] rounded-full mix-blend-multiply filter blur-[140px] opacity-20"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -30, 0],
          x: [0, -50, 0],
          y: [0, 100, 0]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Tertiary Accent Blob (Subtle Purple/Gray tone for depth) */}
      <motion.div
        className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-[#e0f2fe] rounded-full mix-blend-multiply filter blur-[100px] opacity-40"
        animate={{
          scale: [0.8, 1.2, 0.8],
          x: [-20, 20, -20],
          y: [-20, 20, -20]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
      />

      {/* Noise Overlay for Texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` 
           }} 
      />
    </div>
  );
};

export default FluidBackground;