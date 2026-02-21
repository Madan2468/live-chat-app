"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

export default function SyncUser() {
  const { user } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    // Wait until BOTH Clerk has a user AND Convex has confirmed authentication
    if (!user || !isAuthenticated) return;

    const sync = async () => {
      try {
        await storeUser({
          clerkId: user.id,
          name: user.fullName || user.username || "Anonymous",
          email: user.primaryEmailAddress?.emailAddress || "",
          image: user.imageUrl,
        });
      } catch (err) {
        console.error("Error syncing user:", err);
      }
    };

    sync();
  }, [user, isAuthenticated, storeUser]);

  return null;
}
