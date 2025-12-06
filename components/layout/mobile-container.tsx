import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
}

export const MobileContainer = ({
  children,
  className,
}: MobileContainerProps) => {
  return (
    <div className="flex min-h-screen justify-center bg-slate-50">
      <div className={cn("w-full max-w-md bg-white", className)}>
        {children}
      </div>
    </div>
  );
};
