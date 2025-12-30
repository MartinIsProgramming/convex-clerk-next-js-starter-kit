import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  src: string;
  name: string;
  className?: string;
};

/**
 * Reusable user avatar component with fallback to initials.
 */
export function UserAvatar({ src, name, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("size-8 rounded-lg", className)}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className="rounded-lg">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
