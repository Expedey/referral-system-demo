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

  // Function to get badge based on rank
  const getBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "/artboard-15.png"; // 1st place - gold badge
      case 2:
        return "/artboard-15-copy-3.png"; // 2nd place - silver badge
      case 3:
        return "/artboard-15-copy-4.png"; // 3rd place - bronze badge
      default:
        return "/artboard-15-copy-5.png"; // Default badge
    }
  };

  // Use real data if available, otherwise fall back to default data
  const champions = leaderboardData.length >= 3 ? [
    {
      id: leaderboardData[0]?.id || "1",
      name: leaderboardData[0]?.username || "Anonymous",
      referrals: leaderboardData[0]?.total_referrals || 0,
      podiumImage: "/group.png",
      rank: "1",
      podiumHeight: "h-[363px]",
      rankStyles:
        "w-[61px] h-[194px] top-[22px] left-[46px] text-[123.9px] leading-[173.5px]",
    },
    {
      id: leaderboardData[1]?.id || "2",
      name: leaderboardData[1]?.username || "Anonymous",
      referrals: leaderboardData[1]?.total_referrals || 0,
      podiumImage: "/group-1.png",
      rank: "2",
      podiumHeight: "h-[261px]",
      rankStyles:
        "w-[71px] h-[162px] top-[23px] left-[41px] text-[99.1px] leading-[138.8px]",
    },
    {
      id: leaderboardData[2]?.id || "3",
      name: leaderboardData[2]?.username || "Anonymous",
      referrals: leaderboardData[2]?.total_referrals || 0,
      podiumImage: "/group-2.png",
      rank: "3",
      podiumHeight: "h-[204px]",
      rankStyles:
        "w-[57px] h-[95px] top-[18px] left-[47px] text-[74.3px] leading-[104.1px]",
    },
  ] : [
    {
      id: "1",
      name: "Tim John",
      referrals: 7,
      podiumImage: "/group.png",
      rank: "1",
      podiumHeight: "h-[363px]",
      rankStyles:
        "w-[61px] h-[194px] top-[22px] left-[46px] text-[123.9px] leading-[173.5px]",
    },
    {
      id: "2",
      name: "Rassica Tom",
      referrals: 7,
      podiumImage: "/group-1.png",
      rank: "2",
      podiumHeight: "h-[261px]",
      rankStyles:
        "w-[71px] h-[162px] top-[23px] left-[41px] text-[99.1px] leading-[138.8px]",
    },
    {
      id: "3",
      name: "Craig Gouse",
      referrals: 7,
      podiumImage: "/group-2.png",
      rank: "3",
      podiumHeight: "h-[204px]",
      rankStyles:
        "w-[57px] h-[95px] top-[18px] left-[47px] text-[74.3px] leading-[104.1px]",
    },
  ];

  return (
    <section className="flex flex-col w-full mx-auto max-w-[587px] items-center gap-[52px]">
      <h2 className="relative self-stretch mt-[-1.00px] font-medium text-[#1f2c73] text-4xl text-center tracking-[0] leading-[45px] font-rubik">
        Top 3 Champions
      </h2>

      <div className="flex items-end gap-16 relative self-stretch w-full max-md:flex-col max-md:items-center">
        {champions.map((champion) => (
          <div
            key={champion.id}
            className="flex flex-col w-[153px] items-center gap-10 relative"
          >
            <Card className="border-none bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center gap-6 p-0">
                <div className={`relative w-[75px] h-[75px] rounded-full flex items-center justify-center text-white font-rubik font-semibold text-2xl ${getBackgroundColor(champion.name)}`}>
                  {getInitials(champion.name)}
                  
                  {/* Badge for top 3 positions */}
                  <div className="mt-2 absolute -top-4 -left-1">
                    <img
                      src={getBadge(parseInt(champion.rank))}
                      alt={`Rank ${champion.rank} Badge`}
                      className="w-[35px] h-[30px] inline-block"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 w-full">
                  <h3 className="font-medium text-[#1f2c73] text-[19.8px] text-center tracking-[0] leading-[29.7px] font-rubik">
                    {champion.name}
                  </h3>

                  <Badge className="bg-[#732bc4] text-white px-[14.87px] py-[9.91px] rounded-[14.87px] font-medium text-[14.9px] leading-[22.3px] font-rubik hover:bg-[#732bc4]">
                    {champion.referrals} referrals
                  </Badge>

                </div>
              </CardContent>
            </Card>

            <div
              className={`relative w-[153px] ${champion.podiumHeight}`}
              style={{
                backgroundImage: `url(${champion.podiumImage})`,
                backgroundSize: "100% 100%",
              }}
            >
              <div
                className={`absolute ${champion.rankStyles} font-normal text-white text-center tracking-[0] whitespace-nowrap font-rubik`}
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