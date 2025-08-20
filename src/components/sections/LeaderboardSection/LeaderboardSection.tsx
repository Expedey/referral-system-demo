import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";

interface LeaderboardEntry {
  id: string;
  username: string;
  referral_code: string;
  total_referrals: number;
  rank: number;
  avatar_image_url?: string | null;
}

interface LeaderboardSectionProps {
  leaderboardData?: LeaderboardEntry[];
}

export const LeaderboardSection = ({ leaderboardData = [] }: LeaderboardSectionProps) => {
  // Use real data if available, otherwise fall back to default data
  const tableData = leaderboardData.length > 0 ? leaderboardData.map((entry, index) => ({
    id: (index + 1).toString().padStart(2, '0'),
    avatar: entry.avatar_image_url || null,
    name: entry.username || "Anonymous",
    referralCount: entry.total_referrals.toString().padStart(2, '0'),
    rank: entry.rank,
  })) : [
    {
      avatar: "/avatar/avatar1.png",
      id: "01",
      name: "Yeremias",
      referralCount: "07",
      rank: 1,
    },
    {
      avatar: "/avatar/avatar2.png",
      id: "02",
      name: "John Pentol",
      referralCount: "05",
      rank: 2,
    },
    {
      avatar: "/avatar/avatar3.png",
      id: "03",
      name: "Magda Hera",
      referralCount: "03",
      rank: 3,
    },
    {
      avatar: "/avatar/avatar4.png",
      id: "04",
      name: "Danielad Dan",
      referralCount: "04",
      rank: 4,
    },
    {
      id: "05",
      name: "Henry",
      referralCount: "03",
      rank: 5,
    },
    {
      id: "06",
      name: "Thomas C",
      referralCount: "06",
      rank: 6,
    },
    {
      id: "07",
      name: "Paijoo",
      referralCount: "08",
      rank: 7,
    },
  ];




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

  return (
    <section className="relative w-full max-w-[990px] mx-auto md:mt-0 md:pt-0 pt-14 -mt-[200px] z-[999] bg-white">
      <h2 className="text-4xl text-center font-medium text-[#1f2c73] font-rubik mb-10 tracking-[0] leading-[45px]">
        Leaderboard Top Ranking
      </h2>

      <Card className="rounded-[18px] border-none shadow-[0px_8px_32px_rgba(0,0,0,0.12)] ">
        <CardContent className="p-6 overflow-auto max-h-[600px] no-scrollbar">
            <div className="min-w-[600px] ">
              <Table className="">
                <TableHeader>
                  <TableRow className="border-b-[0.75px] border-[#eff2f7]">
                    <TableHead className=" font-rubik font-medium text-[#515184] text-lg">
                      No
                    </TableHead>
                    <TableHead className="font-rubik font-medium text-[#515184] text-lg">
                      User
                    </TableHead>
                    <TableHead className="text-center font-rubik font-medium text-[#515184] text-lg">
                      Referral Count
                    </TableHead>
                    <TableHead className="text-right font-rubik font-medium text-[#515184] text-lg">
                      Badge
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-b-[0.75px] border-[#eff2f7]"
                    >
                      <TableCell className="font-rubik font-medium text-[#7272a8] text-[13px] leading-[20.2px]">
                        {user.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-[38px] h-[38px] relative">
                          {user.avatar && (
                            <Image
                              src={user.avatar}
                              alt="User Avatar"
                              layout="fill"
                              className="rounded-full"
                            />
                          )}
                          {!user.avatar && (
                            <Image
                              src="/avatars/default-avatar.png"
                              alt="User Avatar"
                              layout="fill"
                              className="rounded-full object-cover"
                            />
                          )}
                          </div>
                          <span className="font-rubik font-medium text-[#7272a8] text-[13px] leading-[20.2px]">
                            {user.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-rubik font-medium text-[#7272a8] text-[13px] leading-[20.2px]">
                        {user.referralCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {parseInt(user.referralCount, 10) > 0 &&
                        <img
                          src={getBadge(parseInt(user.referralCount, 10))}
                          alt="Badge"
                          className="w-[29px] h-[25px] inline-block"
                        />
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </section>
  );
};
