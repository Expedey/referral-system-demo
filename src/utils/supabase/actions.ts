"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { generateReferralCode } from "../generateReferralCode";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: signinData, error } = await supabase.auth.signInWithPassword(
    data
  );

  if (error) {
    // redirect("/error");
    return { success: false, error: error.message };
  }

  //   revalidatePath("/", "layout");
  //   redirect("/dashboard");
  return { success: true, user: signinData.user };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      emailRedirectTo: `${formData.get("redirectTo")}/dashboard`,
    },
  };

  const userType = formData.get("userType") as string;
  const username = formData.get("username") as string;
  const sex = formData.get("sex") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;

  const { data: signupData, error } = await supabase.auth.signUp(data);

  if (error) {
    return { success: false, error: error.message };
  }

  if (signupData.user) {
    console.log(data, "data", sex, dateOfBirth);
    // Create user profile
    console.log("[useAuth] Creating user profile with type:", userType);
    const referralCode = generateReferralCode(username);
    const profile = await supabase
      .from("users")
      .insert({
        id: signupData.user.id,
        email: signupData.user.email,
        username,
        referral_code: referralCode.toUpperCase(),
        user_type: userType || "regular",
        sex,
        date_of_birth: dateOfBirth,
      })
      .select()
      .single();
    console.log("[useAuth] Created user profile:", profile);

    // Don't set user state immediately for new signups
    // Let the component handle the flow (show alert, then redirect after email verification)
    // Only set user state if email is already confirmed
    // if (data.user.email_confirmed_at) {
    //   setAuthState({
    //     user: data.user,
    //     profile,
    //     loading: false,
    //     error: null,
    //     isAdmin: false,
    //   });
    // }
  }

  //   if (error) {
  //     redirect("/error");
  //   }

  return { success: true, user: signupData.user };

  //   revalidatePath("/", "layout");
  //   redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
