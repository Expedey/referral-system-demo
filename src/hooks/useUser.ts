import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string;
  username: string;
  avatar_image_url: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  referral_code: string;
};

const useUser = () => {
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<unknown>(null);

  const fetchUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // const userStats = await fetchUserStats(user.id);
    // setUserStats(userStats);

    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    if (user) {
      setIsAuthenticated(true);
      setProfile(data);
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { isAuthenticated, loading, profile, error };
};

export default useUser;
