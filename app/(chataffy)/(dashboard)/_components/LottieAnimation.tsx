'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function LottieAnimation() {
  return (
    <div className="flex justify-center items-center">
      <DotLottieReact
        src="/lottie/loader.lottie"
        loop
        autoplay
        style={{ width: '200px', height: '400px' }}
      />
    </div>
  );
}