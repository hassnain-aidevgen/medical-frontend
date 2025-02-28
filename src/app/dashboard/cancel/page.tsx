import React from "react";
import Link from "next/link";

const CancelPage: React.FC = () => {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>❌ Payment Cancelled</h1>
      <p>Your payment was not completed.</p>
      <Link href="/" style={{ color: "blue", textDecoration: "underline" }}>
        Try Again
      </Link>
    </div>
  );
};

export default CancelPage;
