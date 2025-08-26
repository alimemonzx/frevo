import React from "react";

interface FrevoUserProps {
  image: string;
  name: string;
  username: string;
}

const FrevoUser: React.FC<FrevoUserProps> = ({ image, name, username }) => {
  const shouldShowUsername = name !== username;

  return (
    <div className="flex items-center space-x-3">
      {/* User Image */}
      <div className="flex-shrink-0">
        <img
          src={image}
          alt={`${name}'s profile`}
          className="w-8 h-8 rounded-full object-cover"
        />
      </div>

      {/* User Info */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{name}</span>
        {shouldShowUsername && (
          <span className="text-xs text-gray-500">@{username}</span>
        )}
      </div>
    </div>
  );
};

export default FrevoUser;
