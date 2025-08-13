import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";



export const TopChampionsSection = () => {
  return (
    <section className="flex flex-col w-full items-center gap-2">
      <Card className="w-full bg-[#4C47C4]  text-white relative  bg-no-repeat  bg-center bg-cover shadow-none rounded-3xl sm:min-h-[268px] flex items-center justify-center max-w-[1040px] mx-auto sm:h-[268px]">
        <Image className="z-10 absolute top-0 right-0 max-w-[150px]" src="/top-right.svg" alt="Frame 197" width={1040} height={268} />
        <Image className="max-lg:hidden z-10 absolute top-[23px] left-[31px] max-w-[74px]" src="/top-left.svg" alt="Frame 197" width={1040} height={268} />
        <Image className="z-10 absolute bottom-0 left-0 max-w-[121px]" src="/bottom-left.svg" alt="Frame 197" width={1040} height={268} />
        <Image className="max-lg:hidden z-10 absolute bottom-[28px] right-[25px] max-w-[81px]" src="/bottom-right.svg" alt="Frame 197" width={1040} height={268} />
        <CardContent className="relative z-20 flex flex-col items-center py-6">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative w-[75px] h-[75px] flex items-center justify-center">
              <img
                className="w-[75px] h-[75px] object-cover"
                alt="TrophyIcon icon"
                src="/5174884-1.png"
              />
            </div>

            <h2 className="font-medium text-4xl max-md:text-2xl text-center tracking-[0] leading-[45px] font-rubik">
              Top Referrers
            </h2>
          </div>

          <p className="w-full text-center text-[22px] font-normal font-rubik tracking-[0] md:leading-[45px] max-md:text-lg">
            See who&apos;s leading the pack and get inspired to climb the ranks!
          </p>

          {/* Refresh Button
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </>
              )}
            </button>
          )} */}
        </CardContent>
      </Card>
    </section>
  );
};
