import { NavLink, Outlet } from "react-router-dom";

const navItemBase =
  "flex items-center gap-3 px-4 py-2 rounded-md transition-colors";
const navItemActive = "bg-primary/10 text-primary";
const navItemInactive = "hover:bg-muted text-foreground";

const menu = [
  { to: "/profile/myaccount", label: "My Account" },
  { to: "/profile/mybooking", label: "My Booking" },
  { to: "/profile/purchase/list", label: "Purchase List" },
  { to: "/profile/refund", label: "Refund" },
];

const ProfileLayout = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-3 lg:col-span-3">
          <div className="rounded-lg border bg-card p-4">
            <nav className="flex flex-col gap-1">
              {menu.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  className={({ isActive }) =>
                    [navItemBase, isActive ? navItemActive : navItemInactive].join(
                      " "
                    )
                  }
                >
                  <span className="font-medium">{m.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <section className="md:col-span-9 lg:col-span-9">
          <div className="rounded-lg border bg-card p-4">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfileLayout;
