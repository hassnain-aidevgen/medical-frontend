import { Suspense } from 'react';
import TakeTest from './TakeTest';

export default function page() {
  return (
    <>
      <Suspense fallback={"Loading Tests..."}>
        <TakeTest />
      </Suspense>
    </>
  )
}
