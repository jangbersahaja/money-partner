"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHouseholdInfo, joinHousehold } from "@/lib/actions/household";
import { createBrowserClient } from "@supabase/ssr";
import { Copy, LogOut, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

type HouseholdMember = {
  id: string;
  username: string;
};

type HouseholdInfo = {
  householdId: string;
  members: HouseholdMember[];
  currentUser: HouseholdMember;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<HouseholdInfo | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Fetch info on load
  useEffect(() => {
    getHouseholdInfo().then((data) => {
      if (data) {
        // Ensure currentUser has username property
        const currentUser = data.members.find(
          (m: HouseholdMember) => m.id === data.currentUser.id
        );
        setInfo({
          householdId: data.householdId,
          members: data.members.map((m: HouseholdMember) => ({
            id: m.id,
            username: m.username,
          })),
          currentUser: currentUser
            ? { id: currentUser.id, username: currentUser.username }
            : { id: data.currentUser.id, username: "" },
        });
      } else {
        setInfo(null);
      }
      setLoading(false);
    });
  }, []);

  const handleCopy = () => {
    if (info?.householdId) {
      navigator.clipboard.writeText(info.householdId);
      alert("Household ID copied! Send this to your partner.");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;

    setJoinLoading(true);
    const res = await joinHousehold(inviteCode);
    setJoinLoading(false);

    if (res.error) {
      alert(res.error);
    } else {
      alert("Successfully joined household!");
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-600">Manage household & settings</p>
      </header>

      {/* Household Members */}
      <Card className="p-6">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          Household Members
        </h2>
        <div className="space-y-3">
          {info?.members.map((member: HouseholdMember) => (
            <div key={member.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{member.username}</p>
                <p className="text-xs text-slate-500">
                  {member.id === info.currentUser.id ? "(You)" : "Partner"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Section */}
      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Link with Partner</h2>

        {/* Option A: Share Code */}
        <Card className="p-4 bg-slate-50 border-slate-200">
          <Label className="text-xs text-slate-500 uppercase tracking-wider">
            Your Household ID
          </Label>
          <div className="flex gap-2 mt-2">
            <code className="flex-1 bg-white border p-2 rounded text-sm font-mono truncate">
              {info?.householdId}
            </code>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Share this code with your partner so they can join you.
          </p>
        </Card>

        <div className="relative flex items-center py-2">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink-0 mx-4 text-slate-400 text-xs uppercase">
            OR
          </span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        {/* Option B: Join Code */}
        <Card className="p-4">
          <form onSubmit={handleJoin} className="space-y-3">
            <Label>Join Partner&apos;s Household</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste ID here..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button type="submit" disabled={joinLoading}>
                {joinLoading ? "Joining..." : "Join"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Sign Out */}
      <Button
        variant="destructive"
        className="w-full mt-8"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
