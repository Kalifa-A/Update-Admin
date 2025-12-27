import { Suspense } from "react";
import OrderDetailsClient from "./OrderDetailsClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading order...</div>}>
      <OrderDetailsClient />
    </Suspense>
  );
}
