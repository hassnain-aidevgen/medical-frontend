import React from "react";
import Link from "next/link";

const SuccessPage: React.FC = () => {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>✅ Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
      <Link href="/" style={{ color: "blue", textDecoration: "underline" }}>
        Go back to Home
      </Link>
    </div>
  );
};

export default SuccessPage;
