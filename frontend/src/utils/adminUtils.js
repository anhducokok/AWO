// Utility functions for admin components

export const roleUtils = {
  getColor: (role) => {
    switch (role) {
      case "manager":
        return "bg-purple-100 text-purple-800";
      case "leader":
        return "bg-orange-100 text-orange-800";
      case "member":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  },

  getLabel: (role) => {
    switch (role) {
      case "manager":
        return "Quản lý";
      case "leader":
        return "Trưởng nhóm";
      case "member":
        return "Thành viên";
      default:
        return role;
    }
  },

  getIcon: (role) => {
    // You can return Lucide icons here if needed
    switch (role) {
      case "manager":
        return "UserCheck";
      case "leader":
        return "Users";
      case "member":
        return "User";
      default:
        return "User";
    }
  },
};

export const dateUtils = {
  formatDate: (dateString, locale = "vi-VN") => {
    if (!dateString) return "N/A";

    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  },

  getRelativeTime: (dateString, locale = "vi-VN") => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  },
};

export const stringUtils = {
  truncate: (str, maxLength = 100) => {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "...";
  },

  getInitials: (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  },

  searchMatch: (searchTerm, ...fields) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    return fields.some(
      (field) => field && field.toString().toLowerCase().includes(term),
    );
  },
};

export const arrayUtils = {
  sortBy: (array, key, order = "asc") => {
    return [...array].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Handle dates
      if (
        aVal instanceof Date ||
        (typeof aVal === "string" && !isNaN(Date.parse(aVal)))
      ) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return order === "asc" ? -1 : 1;
      if (aVal > bVal) return order === "asc" ? 1 : -1;
      return 0;
    });
  },

  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  filterBy: (array, filters) => {
    return array.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === "all") return true;
        return item[key] === value;
      });
    });
  },
};

// Constants
export const ROLE_OPTIONS = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "manager", label: "Quản lý" },
  { value: "leader", label: "Trưởng nhóm" },
  { value: "member", label: "Thành viên" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "name", label: "Theo tên" },
];
