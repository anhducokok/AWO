import React from "react";
import { Clock, UserCheck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const StatsCards = ({ stats, loading }) => {
  const statsData = [
    {
      title: "Tổng chờ duyệt",
      value: stats.total,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "text-gray-900",
    },
    {
      title: "Yêu cầu Manager",
      value: stats.managerRequests,
      icon: UserCheck,
      color: "text-purple-500",
      bgColor: "text-purple-600",
    },
    {
      title: "Yêu cầu Leader",
      value: stats.leaderRequests,
      icon: Users,
      color: "text-orange-500",
      bgColor: "text-orange-600",
    },
    {
      title: "Yêu cầu Member",
      value: stats.memberRequests,
      icon: Users,
      color: "text-blue-500",
      bgColor: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;

        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.bgColor}`}>
                    {loading ? (
                      <div className="w-8 h-6 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <IconComponent className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
