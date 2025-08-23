interface HeaderProps {
  FilterIcon: React.ComponentType;
}

export const Header: React.FC<HeaderProps> = ({ FilterIcon }) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg">
          <FilterIcon />
        </div>
        <div className="ml-2">
          <h1 className="text-base font-bold text-gray-900">Frevo</h1>
          <p className="text-xs text-gray-500">Freelancer.com Enhancement</p>
        </div>
      </div>
    </div>
  );
};
