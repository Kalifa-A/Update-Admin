import { Suspense } from "react";
import EditCoupon from "./EditCoupon";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading order...</div>}>
      <EditCoupon />
    </Suspense>
  );
}
