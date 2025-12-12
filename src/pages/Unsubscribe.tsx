import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Unsubscribe = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleUnsubscribe = async () => {
        if (!email) {
            setStatus("error");
            setMessage("Invalid unsubscribe link. Email is missing.");
            return;
        }

        setStatus("loading");
        try {
            const { error } = await supabase.rpc("unsubscribe_user", { p_email: email });
            if (error) throw error;

            setStatus("success");
            setMessage("You have been successfully unsubscribed. You will no longer receive daily digests.");
        } catch (error: any) {
            console.error("Unsubscribe error:", error);
            setStatus("error");
            setMessage(error.message || "Failed to unsubscribe. Please try again later.");
        }
    };

    // Optional: Auto-unsubscribe if they click the link? 
    // Better pattern: Show them a confirmation button to prevent accidental clicks from aggressive email scanners.

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {status === 'success' ? (
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                        ) : status === 'error' ? (
                            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                        ) : (
                            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                                <MailX className="h-8 w-8 text-orange-600" />
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        {status === 'success' ? 'Unsubscribed' : 'Unsubscribe'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">

                    {status === 'idle' && (
                        <>
                            <p className="text-gray-600">
                                Are you sure you want to stop receiving daily exam updates for
                                <span className="font-semibold block mt-1 text-gray-900">{email || "your email"}</span>?
                            </p>
                            <Button
                                onClick={handleUnsubscribe}
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                disabled={!email}
                            >
                                Yes, Unsubscribe Me
                            </Button>
                            <Link to="/" className="block text-sm text-gray-500 hover:underline">
                                Cancel
                            </Link>
                        </>
                    )}

                    {status === 'loading' && (
                        <div className="flex flex-col items-center py-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                            <p className="text-gray-500">Processing your request...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-4">
                            <p className="text-gray-600">{message}</p>
                            <Button asChild variant="outline" className="w-full">
                                <Link to="/">Return to Home</Link>
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-4">
                            <p className="text-red-600 font-medium">{message}</p>
                            <Button onClick={handleUnsubscribe} variant="outline" className="w-full">
                                Try Again
                            </Button>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
};

export default Unsubscribe;
