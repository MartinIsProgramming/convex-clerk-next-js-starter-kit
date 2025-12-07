import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/user-utils";

type UserAvatarProps = {
  src?: string;
  name: string;
  className?: string;
};

export function UserAvatar({ src, name, className = "h-8 w-8" }: UserAvatarProps) {
  return (
    <Avatar className={`${className} rounded-lg`}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className="rounded-lg">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
