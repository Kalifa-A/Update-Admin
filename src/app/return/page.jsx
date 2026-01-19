import { Suspense } from "react";
import ReturUpdate from "./ReturnUpdate";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading return details...</div>}>
      <ReturUpdate />
    </Suspense>
  );
}
