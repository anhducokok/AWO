import React from "react";
import { RefreshCw } from "lucide-react";

const LoadingSpinner = ({ size = "md", text = "Đang tải..." }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const containerClasses = {
    sm: "p-4",
    md: "p-8",
    lg: "p-12",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${containerClasses[size]}`}
    >
      <RefreshCw
        className={`${sizeClasses[size]} animate-spin text-blue-600 mb-2`}
      />
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
