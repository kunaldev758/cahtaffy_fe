"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

import TopHead from "../_components/TopHead";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/app/socketContext";
import {
  generateBlogApi,
  getBlogPostsApi,
  getBlogPublishStatusApi,
  getBlogStoresApi,
  publishBlogApi,
} from "@/app/_api/dashboard/action";

type BlogDraft = {
  title: string;
  summary: string;
  tags: string[];
  html: string;
  topic?: string;
  tone?: string;
  language?: string;
};

type BlogStore = {
  storeHash: string;
  storeUrl?: string;
  platform: "shopify" | "bigcommerce";
  name: string;
  canPublish: boolean;
  missingScope?: string | null;
};

type BlogPostRow = {
  requestId: string;
  title: string;
  status: "draft" | "publishing" | "published" | "failed";
  publishedUrl?: string | null;
  error?: string | null;
  storeHash: string;
  platform: string;
  createdAt?: string;
};

type PublishEvent = {
  requestId: string;
  success: boolean;
  url?: string | null;
  error?: string | null;
  status?: string;
};

const TONES = ["friendly", "professional", "casual", "expert"] as const;

export default function BlogPage() {
  const { socket } = useSocket();

  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("friendly");
  const [language, setLanguage] = useState("English");
  const [blog, setBlog] = useState<BlogDraft | null>(null);
  const [stores, setStores] = useState<BlogStore[]>([]);
  const [selectedStoreHash, setSelectedStoreHash] = useState("");
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState("");

  const selectedStore = useMemo(
    () => stores.find((s) => s.storeHash === selectedStoreHash) || null,
    [stores, selectedStoreHash],
  );

  const loadStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const data = await getBlogStoresApi();
      if (!data?.status) {
        toast.error(data?.message || "Could not load stores");
        setStores([]);
        return;
      }
      const nextStores: BlogStore[] = Array.isArray(data.stores) ? data.stores : [];
      setStores(nextStores);
      setSelectedStoreHash((prev) => {
        if (prev && nextStores.some((s) => s.storeHash === prev)) return prev;
        const publishable = nextStores.find((s) => s.canPublish);
        return publishable?.storeHash || nextStores[0]?.storeHash || "";
      });
    } catch {
      toast.error("Could not load connected stores");
    } finally {
      setLoadingStores(false);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const data = await getBlogPostsApi();
      if (data?.status && Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch {
      // history is optional; keep the page usable
    }
  }, []);

  useEffect(() => {
    loadStores();
    loadPosts();
  }, [loadStores, loadPosts]);

  useEffect(() => {
    if (!socket) return;

    const onPublished = (payload: PublishEvent) => {
      if (!payload?.requestId) return;

      setPosts((prev) =>
        prev.map((post) =>
          post.requestId === payload.requestId
            ? {
                ...post,
                status: (payload.status as BlogPostRow["status"]) ||
                  (payload.success ? "published" : "failed"),
                publishedUrl: payload.url || null,
                error: payload.error || null,
              }
            : post,
        ),
      );

      if (activeRequestId && payload.requestId === activeRequestId) {
        if (payload.success) {
          setPublishMessage(
            payload.url
              ? `Published successfully: ${payload.url}`
              : "Published successfully.",
          );
          toast.success("Blog published to your store");
        } else {
          setPublishMessage(payload.error || "Publishing failed");
          toast.error(payload.error || "Publishing failed");
        }
        setActiveRequestId(null);
      }
    };

    socket.on("blog-published", onPublished);
    return () => {
      socket.off("blog-published", onPublished);
    };
  }, [socket, activeRequestId]);

  // Fallback poll if socket event is missed
  useEffect(() => {
    if (!activeRequestId) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const data = await getBlogPublishStatusApi(activeRequestId);
        if (cancelled || !data?.status || !data.blogPost) return;
        const post = data.blogPost as BlogPostRow;
        if (post.status === "publishing") return;

        setPosts((prev) => {
          const exists = prev.some((p) => p.requestId === post.requestId);
          if (!exists) return [post, ...prev];
          return prev.map((p) => (p.requestId === post.requestId ? { ...p, ...post } : p));
        });

        if (post.status === "published") {
          setPublishMessage(
            post.publishedUrl
              ? `Published successfully: ${post.publishedUrl}`
              : "Published successfully.",
          );
          toast.success("Blog published to your store");
        } else if (post.status === "failed") {
          setPublishMessage(post.error || "Publishing failed");
          toast.error(post.error || "Publishing failed");
        }
        setActiveRequestId(null);
      } catch {
        // keep polling until timeout effect cleanup
      }
    };

    const interval = window.setInterval(poll, 4000);
    const timeout = window.setTimeout(() => {
      setActiveRequestId(null);
      setPublishMessage((msg) =>
        msg || "Still publishing… check Recent publishes below in a moment.",
      );
    }, 120000);

    poll();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [activeRequestId]);

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      toast.error("Enter a blog topic first");
      return;
    }
    setGenerating(true);
    setPublishMessage("");
    try {
      const data = await generateBlogApi({ topic: trimmed, tone, language });
      if (!data?.status || !data.blog) {
        toast.error(data?.message || "Generation failed");
        return;
      }
      setBlog(data.blog);
      toast.success("Draft ready — review and edit before publishing");
    } catch (error: any) {
      toast.error(error?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!blog) return;
    if (!selectedStore) {
      toast.error("Select a connected store");
      return;
    }
    if (!selectedStore.canPublish) {
      toast.error(
        selectedStore.missingScope
          ? `Missing permission: ${selectedStore.missingScope}. Re-authorize the app.`
          : "This store cannot publish blogs yet",
      );
      return;
    }

    setPublishing(true);
    setPublishMessage("");
    try {
      const data = await publishBlogApi({
        ...blog,
        publishNow: true,
        storeHash: selectedStore.storeHash,
      });
      if (!data?.status) {
        toast.error(data?.message || "Could not start publishing");
        return;
      }

      const requestId = data.requestId as string;
      setActiveRequestId(requestId);
      setPublishMessage("Publishing started. Waiting for store confirmation…");
      setPosts((prev) => [
        {
          requestId,
          title: blog.title,
          status: "publishing",
          publishedUrl: null,
          error: null,
          storeHash: selectedStore.storeHash,
          platform: selectedStore.platform,
        },
        ...prev.filter((p) => p.requestId !== requestId),
      ]);
      toast.info("Publishing started");
    } catch (error: any) {
      toast.error(error?.message || "Could not start publishing");
    } finally {
      setPublishing(false);
    }
  };

  const tagsText = blog?.tags?.join(", ") || "";

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <TopHead
        title="AI Blog Writer"
        subtitle="Generate an SEO blog with AI, preview it, then publish to Shopify or BigCommerce"
        showDatePicker={false}
        showWebsiteSelect={false}
        showNotificationBell={false}
        showStatusBadge={false}
      />

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Create draft</h2>
              <p className="text-sm text-[#64748B] mt-1">
                Enter a topic. Chataffy generates title, summary, tags, and HTML body.
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-[#111827] shrink-0 mt-1" />
          </div>

          <textarea
            className="w-full min-h-[88px] rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            placeholder="e.g. 5 summer skincare tips for oily skin"
            value={topic}
            maxLength={300}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm text-[#64748B] space-y-1.5">
              <span>Tone</span>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#111827] bg-white"
                value={tone}
                onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-[#64748B] space-y-1.5">
              <span>Language</span>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#111827]"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="bg-[#111827] hover:bg-gray-800 text-white rounded-xl"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate"
              )}
            </Button>
            {blog && (
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>
        </section>

        {blog && (
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#111827]">Preview & edit</h2>

            <label className="block text-sm text-[#64748B] space-y-1.5">
              <span>Title</span>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-[#111827]"
                value={blog.title}
                onChange={(e) => setBlog({ ...blog, title: e.target.value })}
              />
            </label>

            <label className="block text-sm text-[#64748B] space-y-1.5">
              <span>Summary (SEO meta)</span>
              <textarea
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#111827] min-h-[72px]"
                value={blog.summary}
                maxLength={160}
                onChange={(e) => setBlog({ ...blog, summary: e.target.value })}
              />
            </label>

            <label className="block text-sm text-[#64748B] space-y-1.5">
              <span>Tags (comma separated)</span>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#111827]"
                value={tagsText}
                onChange={(e) =>
                  setBlog({
                    ...blog,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>

            <label className="block text-sm text-[#64748B] space-y-1.5">
              <span>HTML body</span>
              <textarea
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono text-[#111827] min-h-[320px]"
                value={blog.html}
                onChange={(e) => setBlog({ ...blog, html: e.target.value })}
              />
            </label>

            <div className="rounded-xl border border-dashed border-gray-200 p-4 bg-[#F9F9F9]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mb-3">
                Live preview
              </p>
              <article
                className="prose prose-sm max-w-none text-[#111827]"
                dangerouslySetInnerHTML={{ __html: blog.html }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end pt-2">
              <label className="text-sm text-[#64748B] space-y-1.5">
                <span>Publish to store</span>
                {loadingStores ? (
                  <div className="flex items-center gap-2 text-sm text-[#64748B] py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading stores…
                  </div>
                ) : stores.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                    No installed Shopify/BigCommerce store found for this account.
                    Install the Chataffy app on your store first.
                  </p>
                ) : (
                  <select
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#111827] bg-white"
                    value={selectedStoreHash}
                    onChange={(e) => setSelectedStoreHash(e.target.value)}
                  >
                    {stores.map((store) => (
                      <option key={store.storeHash} value={store.storeHash}>
                        {store.name || store.storeHash} ({store.platform})
                        {!store.canPublish ? " — missing permission" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <Button
                onClick={handlePublish}
                disabled={
                  publishing ||
                  !!activeRequestId ||
                  !selectedStore ||
                  !selectedStore.canPublish
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {publishing || activeRequestId ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {publishing ? "Starting…" : "Publishing…"}
                  </>
                ) : (
                  "Publish to my store"
                )}
              </Button>
            </div>

            {selectedStore && !selectedStore.canPublish && (
              <p className="text-sm text-amber-700">
                This store needs{" "}
                <strong>{selectedStore.missingScope || "extra OAuth scopes"}</strong>.
                {selectedStore.platform === "shopify"
                  ? " Reopen Chataffy from Shopify admin to approve write_content."
                  : " Set Content to Modify in the BigCommerce developer portal, then re-authorize."}
              </p>
            )}

            {publishMessage && (
              <p className="text-sm text-[#334155] break-all">{publishMessage}</p>
            )}
          </section>
        )}

        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#111827]">Recent publishes</h2>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={loadPosts}>
              Refresh
            </Button>
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-[#64748B]">No blog publishes yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {posts.map((post) => (
                <li
                  key={post.requestId}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {post.title}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {post.platform} · {post.storeHash} · {post.status}
                      {post.error ? ` · ${post.error}` : ""}
                    </p>
                  </div>
                  {post.publishedUrl ? (
                    <Link
                      href={post.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline shrink-0"
                    >
                      View live
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
