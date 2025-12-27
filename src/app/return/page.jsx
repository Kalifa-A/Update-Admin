import { Suspense } from "react";
import ReturnUpdate from "./ReurnUpdate";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading order...</div>}>
      <ReturnUpdate />
    </Suspense>
  );
}
