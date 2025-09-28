import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProfileRow {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

const MyAccount = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Additional UI-only fields to match the provided layout
  const [gender, setGender] = useState<string>("Male");
  const [birthDay, setBirthDay] = useState<string>("13");
  const [birthMonth, setBirthMonth] = useState<string>("January");
  const [birthYear, setBirthYear] = useState<string>("2004");
  const [city, setCity] = useState<string>("Bandung");
  const [loginVerificationEnabled, setLoginVerificationEnabled] = useState<boolean>(false);
  const [togglingMfa, setTogglingMfa] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        toast.error("Gagal memuat profil");
      } else {
        setProfile(
          data ?? {
            id: user.id,
            username: user.name || user.email?.split("@")[0] || null,
            full_name: user.name || null,
            avatar_url: null,
          }
        );
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('upsert_my_profile', {
        p_username: profile.username ?? null,
        p_full_name: profile.full_name ?? null,
        p_avatar_url: profile.avatar_url ?? null,
        p_gender: gender ?? null,
        p_birthdate: `${birthYear}-${String([
          "January","February","March","April","May","June","July","August","September","October","November","December"
        ].indexOf(birthMonth)+1).padStart(2,'0')}-${String(birthDay).padStart(2,'0')}`,
        p_city: city ?? null,
      });
      if (error) throw error;
      toast.success("Profil berhasil disimpan");
    } catch (rpcErr: any) {
      console.warn('RPC upsert_my_profile failed, falling back to direct upsert:', rpcErr);
      try {
        const { data: existing, error: selErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        if (selErr) throw selErr;

        if (existing) {
          const { error: updErr } = await supabase
            .from('profiles')
            .update({
              username: profile.username ?? undefined,
              full_name: profile.full_name ?? undefined,
              avatar_url: profile.avatar_url ?? undefined,
            })
            .eq('id', user.id);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: profile.username ?? undefined,
              full_name: profile.full_name ?? undefined,
              avatar_url: profile.avatar_url ?? undefined,
            });
          if (insErr) throw insErr;
        }
        toast.success("Profil berhasil disimpan");
      } catch (fallbackErr: any) {
        console.error('Fallback profiles upsert failed:', fallbackErr);
        toast.error(
          fallbackErr?.message ||
            "Gagal menyimpan profil. Pastikan migrasi/izin Supabase sudah diterapkan."
        );
      }
    }
    setSaving(false);
  };

  if (!user) {
    return <div>Silakan login untuk mengatur akun.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account Information</TabsTrigger>
            <TabsTrigger value="security">Password & Security</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            {/* Personal Data */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Personal Data</h2>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm mb-1">Full Name</label>
                    <Input
                      value={profile?.full_name ?? ""}
                      onChange={(e) =>
                        setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))
                      }
                      placeholder="Your full name will also appear as your profile name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Gender</label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Birthdate</label>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={birthDay} onValueChange={setBirthDay}>
                          <SelectTrigger>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => `${i + 1}`).map((d) => (
                              <SelectItem key={d} value={String(d)}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={birthMonth} onValueChange={setBirthMonth}>
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December",
                            ].map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={birthYear} onValueChange={setBirthYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 100 }, (_, i) => `${new Date().getFullYear() - i}`).map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">City of Residence</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="secondary" disabled>
                    Maybe later
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </div>
              </CardContent>
            </Card>

            {/* Email */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Email</h2>
                    <p className="text-sm text-muted-foreground">You may use up to 3 email(s)</p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info('Add Email yet to be implemented')}>
                    + Add Email
                  </Button>
                </div>
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      1. {user.email}
                    </div>
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">Recipient for notifications</div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Number */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Mobile Number</h2>
                    <p className="text-sm text-muted-foreground">You may use up to 3 mobile number(s)</p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info('Add Mobile Number yet to be implemented')}>
                    + Add Mobile Number
                  </Button>
                </div>
                <div className="rounded-md border p-4">
                  <div className="font-medium">1. +628112000143</div>
                  <div className="text-xs text-emerald-600 mt-1">Recipient for notifications</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Security & Authentication */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Security & Authentication</h2>
                <div className="flex items-start justify-between rounded-md border">
                  <div className="p-4">
                    <div className="font-medium">Enable login verification</div>
                    <div className="text-sm text-muted-foreground">
                      Send me a verification code every time I log in from a new device
                    </div>
                  </div>
                  <div className="p-4">
                    <Switch
                      checked={loginVerificationEnabled}
                      onCheckedChange={async (checked) => {
                        setTogglingMfa(true);
                        try {
                          const { error } = await supabase.rpc('set_mfa_enabled', { enabled: checked });
                          if (error) throw error;
                          setLoginVerificationEnabled(checked);
                          toast.success(checked ? 'Login verification enabled' : 'Login verification disabled');
                        } catch (e: any) {
                          toast.error(e?.message || 'Gagal mengubah pengaturan verifikasi login');
                        } finally {
                          setTogglingMfa(false);
                        }
                      }}
                      disabled={togglingMfa}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <div className="text-base font-semibold">Delete Account</div>
                    <div className="text-sm text-muted-foreground">
                      Once your account is deleted, you will not be able to restore your account or data.
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="link" className="text-primary">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove your
                          data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            if (!user) return;
                            setDeleting(true);
                            try {
                              const { error } = await supabase
                                .from('account_deletion_requests')
                                .insert({ user_id: user.id, reason: null });
                              if (error) throw error;
                              toast.success('Permintaan penghapusan akun dikirim. Kami akan memprosesnya.');
                            } catch (e: any) {
                              toast.error(e?.message || 'Gagal mengirim permintaan penghapusan akun');
                            } finally {
                              setDeleting(false);
                            }
                          }}
                          disabled={deleting}
                        >
                          {deleting ? 'Processing...' : 'Confirm'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyAccount;
