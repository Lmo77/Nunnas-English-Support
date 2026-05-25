import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET(request) {
  const redis = Redis.fromEnv();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const activity = await redis.get(`activity:${id}`);
    if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(activity);
  }
  const keys = await redis.keys("activity:*");
  if (keys.length === 0) return NextResponse.json([]);
  const activities = await Promise.all(keys.map((k) => redis.get(k)));
  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json(activities);
}

export async function POST(request) {
  const redis = Redis.fromEnv();
  const body = await request.json();
  const id = Math.random().toString(36).slice(2, 9);
  const activity = {
    id,
    ...body,
    createdAt: new Date().toISOString(),
    published: true,
  };
  await redis.set(`activity:${id}`, activity);
  return NextResponse.json(activity);
}

export async function DELETE(request) {
  const redis = Redis.fromEnv();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "No id" }, { status: 400 });
  await redis.del(`activity:${id}`);
  return NextResponse.json({ success: true });
}
