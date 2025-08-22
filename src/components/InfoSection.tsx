interface InfoSectionProps {
  StarIcon: React.ComponentType;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ StarIcon }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-start">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mr-3 flex-shrink-0">
          <StarIcon />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-800 mb-1">
            What Frevo does
          </h3>
          <p className="text-xs text-blue-700 leading-relaxed">
            Automatically hides projects with{" "}
            <span className="font-bold">0 ratings</span> on Freelancer.com and{" "}
            <span className="font-bold">supports AI proposal writing</span> to
            help you focus on quality opportunities and craft winning proposals.
          </p>
        </div>
      </div>
    </div>
  );
};
