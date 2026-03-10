import React from "react";
import { Mail, Calendar, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleUtils, dateUtils, stringUtils } from "@/utils/adminUtils";

const UserCard = ({ user, onViewDetails, onApprove, onReject }) => {
  // Early return if user is null/undefined
  if (!user) {
    return null;
  }
    
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {stringUtils.getInitials(user.name)}
              </span>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <Badge className={roleUtils.getColor(user.requestedRole)}>
                  {roleUtils.getLabel(user.requestedRole)}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {dateUtils.formatDate(user.submittedAt)}
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-1">{user.department}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(user)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Chi tiết
            </Button>

            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onApprove(user.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Phê duyệt
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(user.id)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Từ chối
            </Button>
          </div>
        </div>

        {/* Quick preview of reason */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">
            <span className="font-medium">Lý do tham gia:</span>{" "}
            {stringUtils.truncate(user.reason, 120)}
          </p>
        </div>
      </CardContent>
    </Card>
  );

};

export default UserCard;
