import {
  data,
  redirect,
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/app-settings";
import { createSupabaseClient } from "~/lib/supabase.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "設定 — かくね" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const responseHeaders = new Headers();
  const supabase = createSupabaseClient(request, responseHeaders);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login", { headers: responseHeaders });
  }

  return data(
    {
      email: user.email ?? "",
      googleFormUrl: process.env.GOOGLE_FORM_URL ?? "",
    },
    { headers: responseHeaders }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const responseHeaders = new Headers();
  const supabase = createSupabaseClient(request, responseHeaders);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update-password") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return redirect("/login", { headers: responseHeaders });

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword.length < 8) {
      return data(
        { error: "パスワードは8文字以上で入力してください" },
        { headers: responseHeaders }
      );
    }
    if (newPassword !== confirmPassword) {
      return data(
        { error: "パスワードが一致しません" },
        { headers: responseHeaders }
      );
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    if (verifyError) {
      return data(
        { error: "現在のパスワードが正しくありません" },
        { headers: responseHeaders }
      );
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return data({ error: error.message }, { headers: responseHeaders });

    await supabase.auth.signOut({ scope: "others" });
    return data({ message: "パスワードを変更しました" }, { headers: responseHeaders });
  }

  // logout
  await supabase.auth.signOut();
  return redirect("/", { headers: responseHeaders });
}

export default function AppSettings() {
  const { email, googleFormUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* アカウント情報 */}
      <section className="bg-white rounded-2xl shadow-sm px-5 py-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          アカウント
        </p>
        <p className="text-sm text-slate-500">メールアドレス</p>
        <p className="text-base text-slate-700 font-medium mt-0.5">{email}</p>
      </section>

      {/* パスワード変更 */}
      <section className="bg-white rounded-2xl shadow-sm px-5 py-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
          パスワード変更
        </p>
        <Form method="post" className="flex flex-col gap-3">
          <input type="hidden" name="intent" value="update-password" />
          <div className="flex flex-col gap-1">
            <label htmlFor="currentPassword" className="text-sm text-slate-600">
              現在のパスワード
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="newPassword" className="text-sm text-slate-600">
              新しいパスワード
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="8文字以上"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm text-slate-600">
              新しいパスワード（確認）
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="8文字以上"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition"
            />
          </div>

          {actionData && "error" in actionData && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
              {actionData.error}
            </p>
          )}
          {actionData && "message" in actionData && (
            <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
              {actionData.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 rounded-xl bg-slate-700 text-white text-sm font-medium py-3 active:scale-95 transition-transform disabled:opacity-60"
          >
            {isSubmitting ? "変更中..." : "パスワードを変更"}
          </button>
        </Form>
      </section>

      {/* 感想・要望 */}
      {googleFormUrl && (
        <section className="bg-white rounded-2xl shadow-sm px-5 py-2">
          <a
            href={googleFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left py-3 text-base text-slate-700 font-medium flex items-center justify-between"
          >
            感想・要望を送る
            <span className="text-xs text-slate-400 mr-1">Googleフォームが開きます</span>
            <span className="text-slate-400">›</span>
          </a>
        </section>
      )}

      {/* ログアウト */}
      <section className="bg-white rounded-2xl shadow-sm px-5 py-2">
        <Form method="post">
          <input type="hidden" name="intent" value="logout" />
          <button
            type="submit"
            className="w-full text-left py-3 text-base text-red-500 font-medium"
          >
            ログアウト
          </button>
        </Form>
      </section>
    </div>
  );
}
