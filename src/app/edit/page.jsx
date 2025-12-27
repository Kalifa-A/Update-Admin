import { Suspense } from "react";
import EditContent from "./EditContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading order...</div>}>
      <EditContent />
    </Suspense>
  );
}
