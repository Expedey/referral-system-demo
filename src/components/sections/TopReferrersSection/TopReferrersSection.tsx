import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface LeaderboardEntry {
  id: string;
  username: string;
  referral_code: string;
  total_referrals: number;
  rank: number;
}

interface TopReferrersSectionProps {
  leaderboardData?: LeaderboardEntry[];
}

export const TopReferrersSection = ({ leaderboardData = [] }: TopReferrersSectionProps) => {
  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Function to get background color based on name
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-blue-500/80',
      'bg-green-500/80', 
      'bg-purple-500/80',
      'bg-pink-500/80',
      'bg-indigo-500/80',
      'bg-red-500/80',
      'bg-yellow-500/80',
      'bg-teal-500/80',
      'bg-orange-500/80',
      'bg-cyan-500/80'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Function to get badge based on referral count
  const getBadge = (referralCount: number) => {
    if (referralCount > 10) {
      return "/badge/gold.svg"; // Gold badge for more than 10 referrals
    } else if (referralCount >= 5 && referralCount <= 10) {
      return "/badge/silver.svg"; // Silver badge for 5-10 referrals
    } else if (referralCount >= 1 && referralCount <= 4) {
      return "/badge/bronze.svg"; // Bronze badge for 1-4 referrals
    } else {
      return ""; // Default badge for 0 referrals
    }
  };

  // Use real data if available, otherwise fall back to default data
  const champions = leaderboardData.length >= 3 ? [
    {
      id: leaderboardData[0]?.id || "1",
      name: leaderboardData[0]?.username || "Anonymous",
      referrals: leaderboardData[0]?.total_referrals || 0,
      podiumImage: "/group.png",
      rank: leaderboardData[0]?.rank,
      rankStyles:
        "w-[61px] h-[194px] top-[22px] left-[46px] text-[123.9px] leading-[173.5px] max-md:w-[40px] max-md:h-[120px] max-md:top-[15px] max-md:left-[30px] max-md:text-[60px] max-md:leading-[80px] max-sm:w-[30px] max-sm:h-[90px] max-sm:top-[10px] max-sm:left-[25px] max-sm:text-[40px] max-sm:leading-[60px]",
    },
    {
      id: leaderboardData[1]?.id || "2",
      name: leaderboardData[1]?.username || "Anonymous",
      referrals: leaderboardData[1]?.total_referrals || 0,
      podiumImage: "/group-1.png",
      rank: leaderboardData[1]?.rank,
      rankStyles:
        "w-[71px] h-[162px] top-[23px] left-[41px] text-[99.1px] leading-[138.8px] max-md:w-[45px] max-md:!h-[100px] max-md:top-[15px] max-md:left-[27px] max-md:text-[50px] max-md:leading-[70px] max-sm:w-[35px] max-sm:h-[75px] max-sm:top-[10px] max-sm:left-[22px] max-sm:text-[35px] max-sm:leading-[55px]",
    },
    {
      id: leaderboardData[2]?.id || "3",
      name: leaderboardData[2]?.username || "Anonymous",
      referrals: leaderboardData[2]?.total_referrals || 0,
      podiumImage: "/group-2.png",
      rank: leaderboardData[2]?.rank,
      rankStyles:
        "w-[57px] h-[95px] top-[18px] left-[47px] text-[74.3px] leading-[104.1px] max-md:w-[35px] max-md:!h-[60px] max-md:top-[12px] max-md:left-[32px] max-md:text-[40px] max-md:leading-[55px] max-sm:w-[25px] max-sm:h-[45px] max-sm:top-[8px] max-sm:left-[27px] max-sm:text-[28px] max-sm:leading-[40px]",
    },
  ] : [
    {
      id: "1",
      name: "Tim John",
      referrals: 7,
      podiumImage: "/group.png",
      rank: "1",
      rankStyles:
        "w-[61px] h-[194px] top-[22px] left-[46px] text-[123.9px] leading-[173.5px] max-md:w-[40px] max-md:h-[120px] max-md:top-[15px] max-md:left-[30px] max-md:text-[60px] max-md:leading-[80px] max-sm:w-[30px] max-sm:h-[90px] max-sm:top-[10px] max-sm:left-[25px] max-sm:text-[40px] max-sm:leading-[60px]",
    },
    {
      id: "2",
      name: "Rassica Tom",
      referrals: 7,
      podiumImage: "/group-1.png",
      rank: "2",
      rankStyles:
        "w-[71px] h-[162px] top-[23px] left-[41px] text-[99.1px] leading-[138.8px] max-md:w-[45px] max-md:!h-[100px] max-md:top-[15px] max-md:left-[27px] max-md:text-[50px] max-md:leading-[70px] max-sm:w-[35px] max-sm:h-[75px] max-sm:top-[10px] max-sm:left-[22px] max-sm:text-[35px] max-sm:leading-[55px]",
    },
    {
      id: "3",
      name: "Craig Gouse",
      referrals: 7,
      podiumImage: "/group-2.png",
      rank: "3",
      rankStyles:
        "w-[57px] h-[95px] top-[18px] left-[47px] text-[74.3px] leading-[104.1px] max-md:w-[35px] max-md:!h-[60px] max-md:top-[12px] max-md:left-[32px] max-md:text-[40px] max-md:leading-[55px] max-sm:w-[25px] max-sm:h-[45px] max-sm:top-[8px] max-sm:left-[27px] max-sm:text-[28px] max-sm:leading-[40px]",
    },
  ];

  return (
    <section className="flex flex-col w-full mx-auto max-w-[587px] items-center gap-[52px]">
      <h2 className="relative self-stretch mt-[-1.00px] font-medium text-[#1f2c73] text-4xl text-center tracking-[0] leading-[45px] font-rubik">
        Top 3 Champions
      </h2>

      <div className="flex items-end gap-16 relative self-stretch w-full max-md:flex-row max-md:gap-4 max-md:justify-center">
        {champions.map((champion) => (
          <div
            key={champion.id}
            className="flex flex-col w-[153px] max-md:w-[100px] max-sm:w-[80px] items-center gap-10 max-md:gap-4 relative"
          >
            <Card className="border-none bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center gap-6 max-md:gap-3 p-0">
                <div className={`relative w-[75px] h-[75px] max-md:w-[60px] max-md:h-[60px] max-sm:w-[50px] max-sm:h-[50px] rounded-full flex items-center justify-center text-white font-rubik font-semibold text-2xl max-md:text-xl max-sm:text-lg ${getBackgroundColor(champion.name)}`}>
                  {getInitials(champion.name)}
                  
                  {/* Badge for top 3 positions */}
                  <div className="mt-2 absolute -top-4 -left-1 max-md:-top-4 max-md:left-0 max-sm:-top-3 max-sm:-left-1">
                    {champion.referrals>0&&
                    <img
                      src={getBadge(champion.referrals)}
                      alt={`Rank ${champion.rank} Badge`}
                      className="w-[35px] h-[30px] max-md:w-[25px] max-md:h-[20px] max-sm:w-[20px] max-sm:h-[16px] inline-block"
                    />
                    }
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 w-full">
                  <h3 className="font-medium text-[#1f2c73] text-[19.8px] max-md:text-[16px] max-sm:text-[14px] text-center tracking-[0] leading-[29.7px] max-md:leading-[20px] max-sm:leading-[18px] font-rubik">
                    {champion.name}
                  </h3>

                  <Badge className="bg-[#732bc4] text-white px-[14.87px] py-[9.91px] max-md:px-[10px] max-md:py-[6px] max-sm:px-[8px] max-sm:py-[4px] rounded-[14.87px] max-md:rounded-[10px] max-sm:rounded-[8px] font-medium text-[14.9px] max-md:text-[12px] max-sm:text-[10px] leading-[22.3px] max-md:leading-[16px] max-sm:leading-[14px] font-rubik hover:bg-[#732bc4]">
                    {champion.referrals} referrals
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div
              className={`relative w-[153px] max-md:w-[100px] max-sm:w-[80px] ${
                champion.rank === 1 ? 
                  "h-[363px] " :
                  champion.rank === 2 ?
                  "h-[261px]" :
                  "h-[204px]"
              }`}
              style={{
                backgroundImage: `url(${champion.podiumImage})`,
                backgroundSize: "100% 100%",
              }}
            >
              <div
                className={`absolute font-normal text-white text-center tracking-[0] whitespace-nowrap font-rubik
                  ${champion.rank === 1 ? 
                    "w-[61px] h-[194px] top-[22px] left-[46px] text-[123.9px] leading-[173.5px] max-md:w-[40px] max-md:h-[120px] max-md:top-[15px] max-md:left-[30px] max-md:text-[60px] max-md:leading-[80px] max-sm:w-[30px] max-sm:h-[90px] max-sm:top-[20px] max-sm:left-[25px] max-sm:text-[40px] max-sm:leading-[60px]" :
                    champion.rank === 2 ?
                    "w-[71px] h-[162px] top-[23px] left-[41px] text-[99.1px] leading-[138.8px] max-md:w-[45px] max-md:!h-[100px] max-md:top-[15px] max-md:left-[27px] max-md:text-[50px] max-md:leading-[70px] max-sm:w-[35px] max-sm:h-[75px] max-sm:top-[20px] max-sm:left-[22px] max-sm:text-[35px] max-sm:leading-[55px]" :
                    "w-[57px] h-[95px] top-[18px] left-[47px] text-[74.3px] leading-[104.1px] max-md:w-[35px] max-md:!h-[60px] max-md:top-[12px] max-md:left-[32px] max-md:text-[40px] max-md:leading-[55px] max-sm:w-[25px] max-sm:h-[45px] max-sm:top-[20px] max-sm:left-[27px] max-sm:text-[28px] max-sm:leading-[40px]"
                  }`}
              >
                {champion.rank}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};