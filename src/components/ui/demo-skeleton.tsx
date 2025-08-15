import { Skeleton } from "./skeleton";

interface DemoSkeletonProps {
  type: 'image-classification' | 'sentiment-analysis' | 'recommendation';
  className?: string;
}

export const DemoSkeleton = ({ type, className }: DemoSkeletonProps) => {
  switch (type) {
    case 'image-classification':
      return (
        <div className={`space-y-4 ${className}`}>
          {/* Text prompt input skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-10" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
          
          {/* Upload area skeleton */}
          <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
            <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-4 w-64 mx-auto mb-4" />
            <Skeleton className="h-10 w-32 mx-auto" />
          </div>
        </div>
      );

    case 'sentiment-analysis':
      return (
        <div className={`space-y-4 ${className}`}>
          {/* Textarea skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-3 w-20 ml-auto" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      );

    case 'recommendation':
      return (
        <div className={`space-y-4 ${className}`}>
          {/* Genre selection skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      );

    default:
      return (
        <div className={`space-y-4 ${className}`}>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
  }
};