"use client";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51Qwr2dQ4u3lPIMsd6lCnTgHH9TBOVoHWlc0uuEbkkd3NP8kip5tIJvLdVmMEBxzz1CloLU2XrKaZPseerPmeJCh3007oito4hM"); // Replace with your actual Stripe public key

const handlePayment = async (amount: number) => {
    const res = await fetch("https://medical-backend-loj4.onrender.com/api/test/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
    });

    const { sessionId } = await res.json();
    const stripe = await stripePromise;
    if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
    } else {
        console.error("Stripe failed to load.");
    }
};

export default function PaymentsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Stripe Payment</h1>
            <div className="space-y-4">
                <button
                    onClick={() => handlePayment(500)}
                    className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600"
                >
                    Pay $5 - Basic
                </button>
                <button
                    onClick={() => handlePayment(1000)}
                    className="px-6 py-3 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600"
                >
                    Pay $10 - Standard
                </button>
                <button
                    onClick={() => handlePayment(2000)}
                    className="px-6 py-3 bg-red-500 text-white font-semibold rounded-md shadow-md hover:bg-red-600"
                >
                    Pay $20 - Premium
                </button>
            </div>
        </div>
    );
}
