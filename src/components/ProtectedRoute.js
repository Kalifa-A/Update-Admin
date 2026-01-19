"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("adminUser");
    if (!storedUser) {
      router.push("/login"); // Not logged in
      return;
    }

    const user = JSON.parse(storedUser);
    setUserRole(user.role);

    if (!allowedRoles.includes(user.role)) {
      router.push("/unauthorized");
    } else {
      setLoading(false);
    }
  }, [router, allowedRoles]);

  if (loading) return <p>Loading...</p>;

  return <>{children}</>;
}
