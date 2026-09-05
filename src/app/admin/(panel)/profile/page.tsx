import { changePassword } from "../actions";

export default function ProfilePage() {
  return (
    <form action={changePassword} className="max-w-md space-y-4">
      <h1 className="font-display text-3xl">Admin Profile</h1>
      <p className="text-sm text-muted">Change the administrator password. The new password is stored as a hash.</p>
      <label className="block text-sm">
        New password
        <input name="password" type="password" required minLength={10} className="mt-1 w-full border px-3 py-2" />
      </label>
      <button className="bg-navy px-4 py-2 text-xs tracking-widest text-white">UPDATE PASSWORD</button>
    </form>
  );
}
