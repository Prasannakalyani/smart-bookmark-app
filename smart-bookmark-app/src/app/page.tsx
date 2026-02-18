"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function Home() {

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [bookmarkList, setBookmarkList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
  });

  const [isAdding, setIsAdding] = useState(false);
  const [deletingBookmarkId, setDeletingBookmarkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user ?? null);
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  
  useEffect(() => {
    if (!currentUser) return;

    fetchUserBookmarks();

    const channel = supabase
      .channel("user-bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarkList((prev) => [payload.new, ...prev]);
          }

          if (payload.eventType === "DELETE") {
            setBookmarkList((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const fetchUserBookmarks = async () => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setBookmarkList(data || []);
    }
  };

  
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setBookmarkList([]);
  };

  const handleAddBookmark = async () => {
    if (!formData.title.trim() || !formData.url.trim()) return;

    if (!/^https?:\/\/.+/i.test(formData.url)) {
      setError("Please enter a valid URL (must start with http:// or https://)");
      return;
    }

    setIsAdding(true);
    setError(null);

    const tempId = Date.now().toString();

    const optimisticBookmark = {
      id: tempId,
      title: formData.title.trim(),
      url: formData.url.trim(),
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
    };

    setBookmarkList((prev) => [optimisticBookmark, ...prev]);

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([
        {
          title: formData.title.trim(),
          url: formData.url.trim(),
          user_id: currentUser.id,
        },
      ])
      .select()
      .single();

    if (error) {
      setBookmarkList((prev) =>
        prev.filter((item) => item.id !== tempId)
      );
      setIsAdding(false);
      return;
    }

    setBookmarkList((prev) =>
      prev.map((item) => (item.id === tempId ? data : item))
    );

    setFormData({ title: "", url: "" });
    setIsAdding(false);
  };

  const handleDeleteBookmark = async (id: string) => {
    setDeletingBookmarkId(id);

  
    setBookmarkList((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) {
      fetchUserBookmarks();
    }

    setDeletingBookmarkId(null);
  };

  
  if (!currentUser) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-30 top-0 left-0"></div>
        <div className="absolute w-96 h-96 bg-pink-600 rounded-full blur-3xl opacity-30 top-20 right-0"></div>

        <div className="relative z-10 bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-2xl text-center w-[90%] max-w-md border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-4">
            Smart Bookmark App
          </h1>
          <p className="text-gray-300 mb-8">
            Securely manage your personal bookmarks.
          </p>

          <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-3 w-full bg-white text-gray-800 font-medium py-3 rounded-lg shadow-lg hover:scale-105 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-indigo-600 rounded-full blur-3xl opacity-20 -top-20 -left-20"></div>

      <div className="relative z-10 max-w-3xl mx-auto py-12 px-6">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">
            Bookmark Dashboard
          </h1>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition shadow-lg"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl mb-8 border border-white/20">
          <h2 className="text-xl font-semibold mb-4">
            Add New Bookmark
          </h2>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Bookmark Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="flex-1 bg-white/20 border border-white/30 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="https://www.bookmark.com"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              className="flex-1 bg-white/20 border border-white/30 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={handleAddBookmark}
              disabled={isAdding}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg shadow-lg transition"
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

      
        <div className="space-y-4">
          {bookmarkList.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex justify-between items-center bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 hover:scale-[1.02] transition shadow-lg"
            >
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 font-medium hover:underline"
              >
                {bookmark.title}
              </a>

              <button
                onClick={() => handleDeleteBookmark(bookmark.id)}
                disabled={deletingBookmarkId === bookmark.id}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm transition"
              >
                {deletingBookmarkId === bookmark.id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}