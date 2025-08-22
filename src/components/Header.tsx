interface HeaderProps {
  FilterIcon: React.ComponentType;
}

export const Header: React.FC<HeaderProps> = ({ FilterIcon }) => {
  return (
    <div className="flex items-center mb-6">
      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
        <FilterIcon />
      </div>
      <div className="ml-3">
        <h1 className="text-lg font-bold text-gray-900">Frevo</h1>
        <p className="text-xs text-gray-500">Freelancer.com Enhancement</p>
      </div>
    </div>
  );
};
