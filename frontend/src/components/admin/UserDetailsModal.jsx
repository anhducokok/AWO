import React from "react";
import { XCircle, Calendar, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { roleUtils, dateUtils } from "@/utils/adminUtils";

const UserDetailsModal = ({ user, onClose, onApprove, onReject }) => {
  if (!user) return null;

  const handleApprove = () => {
    onApprove(user.id);
    onClose();
  };

  const handleReject = () => {
    onReject(user.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Chi tiết đơn đăng ký
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Họ tên
                  </label>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Số điện thoại
                  </label>
                  <p className="text-gray-900">
                    {user.phone || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phòng ban
                  </label>
                  <p className="text-gray-900">
                    {user.department || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Request */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                Yêu cầu phân quyền
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Vai trò yêu cầu:</span>
                <Badge className={roleUtils.getColor(user.requestedRole)}>
                  {roleUtils.getLabel(user.requestedRole)}
                </Badge>
              </div>
            </div>

            {/* Experience */}
            {user.experience && (
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Kinh nghiệm
                </label>
                <p className="text-gray-700 mt-1">{user.experience}</p>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="text-sm font-medium text-gray-900">
                Lý do tham gia
              </label>
              <p className="text-gray-700 mt-1 leading-relaxed">
                {user.reason}
              </p>
            </div>

            {/* Submit Date */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-gray-600">
                  Ngày gửi: {dateUtils.formatDate(user.submittedAt)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({dateUtils.getRelativeTime(user.submittedAt)})
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Phê duyệt
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                className="flex-1"
              >
                <UserX className="h-4 w-4 mr-2" />
                Từ chối
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
