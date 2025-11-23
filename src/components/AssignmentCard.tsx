// import { formatDistanceToNow } from "date-fns";

interface AssignmentCardProps {
  title: string;
  subject: string;
  dueTime: string;
  points: number;
  createdAt: string;
}

export default function AssignmentCard({
  title,
  subject,
  dueTime,
  points,
  createdAt = '2025-11-23',
}: AssignmentCardProps) {
  return (
    <div className="w-full my-3">
      {/* time ago */}
      <p className="text-sm text-gray-500 mb-2">
        Due {createdAt} ago
      </p>

      {/* card */}
      <div
        className="flex items-center justify-between bg-gray-100 p-4 rounded-xl shadow-sm 
                   hover:shadow-md transition cursor-pointer"
      >
        <div className="flex items-center gap-4">
          {/* avatar circle */}
          <div className="w-12 h-12 bg-yellow-500 text-white flex items-center justify-center 
                          rounded-full text-lg font-semibold">
            J
          </div>

          {/* text info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

            <p className="text-sm text-gray-500">
              {subject} –{" "}
              <span className="text-red-500 font-medium">Due: {dueTime}</span>
            </p>
          </div>
        </div>

        {/* points */}
        <p className="text-sm font-medium text-gray-600">{points} points</p>
      </div>
    </div>
  );
}
