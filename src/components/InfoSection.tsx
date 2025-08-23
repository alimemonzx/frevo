interface InfoSectionProps {
  StarIcon: React.ComponentType;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ StarIcon }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3">
      <div className="flex items-center">
        <div className="flex items-center justify-center w-6 h-6 bg-amber-100 rounded-lg mr-2">
          <StarIcon />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-800">
            Star Rating Filter
          </h3>
          <p className="text-xs text-gray-500">
            Filter projects by minimum star rating on search pages
          </p>
        </div>
      </div>
    </div>
  );
};
