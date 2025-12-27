import { Suspense } from "react";
import CustomerDetails from "./CustomerDetails";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading order...</div>}>
      <CustomerDetails />
    </Suspense>
  );
}
