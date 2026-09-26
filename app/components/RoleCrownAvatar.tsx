type RoleCrownAvatarProps = {
  role: string;
};

export default function RoleCrownAvatar({ role }: RoleCrownAvatarProps) {
  const tier = role === "owner" ? "gold" : role === "manager" ? "silver" : "bronze";
  const label = role === "owner" ? "Giám đốc, vương miện vàng" : role === "manager" ? "Quản lý, vương miện bạc" : "Nhân viên, vương miện đồng";

  return (
    <span className={`admin-user-avatar role-crown-avatar is-${tier}`} role="img" aria-label={label}>
      <span className="role-crown-avatar-crown" aria-hidden="true">♛</span>
      <span className="role-crown-avatar-person" aria-hidden="true"><i /><b /></span>
    </span>
  );
}
