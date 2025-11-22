/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SiteContent } from "../types";

const API_BASE = "/retail/api";

export const fetchSiteContent = async (): Promise<SiteContent | null> => {
  console.log("🚀 fetchSiteContent called");
  try {
    console.log("📡 Making GET request to:", `${API_BASE}/content`);
    const response = await fetch(`${API_BASE}/content`);
    console.log("📡 Response status:", response.status);
    console.log("📡 Response ok:", response.ok);

    if (!response.ok) {
      console.error("❌ Response not ok, status:", response.status);
      const errorText = await response.text();
      console.error("❌ Response error text:", errorText);
      throw new Error("Failed to fetch content");
    }

    const data = await response.json();
    console.log("✅ Fetch successful, data:", data);
    return data.content;
  } catch (error) {
    console.error("💥 Error fetching site content:", error);
    return null;
  }
};

export const saveSiteContent = async (
  content: SiteContent
): Promise<boolean> => {
  console.log("🚀 saveSiteContent called with content:", content);
  try {
    const token = localStorage.getItem("admin_token");
    console.log("🔑 Token from localStorage:", token ? "present" : "missing");

    if (!token) {
      console.error("❌ No authentication token found");
      return false;
    }

    console.log("📡 Making POST request to:", `${API_BASE}/content`);
    const response = await fetch(`${API_BASE}/content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response ok:", response.ok);

    if (!response.ok) {
      console.error("❌ Response not ok, status:", response.status);
      const errorText = await response.text();
      console.error("❌ Response error text:", errorText);
      throw new Error("Failed to save content");
    }

    console.log("✅ Save successful");
    return true;
  } catch (error) {
    console.error("💥 Error saving site content:", error);
    return false;
  }
};

export const authenticateAdmin = async (
  username: string,
  password: string
): Promise<{ success: boolean; token?: string }> => {
  console.log("🚀 authenticateAdmin called with username:", username);
  try {
    console.log("📡 Making POST request to:", `${API_BASE}/auth`);
    const response = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response ok:", response.ok);

    if (!response.ok) {
      console.log("❌ Authentication failed, response not ok");
      return { success: false };
    }

    const data = await response.json();
    console.log(
      "✅ Authentication successful, token received:",
      data.token ? "yes" : "no"
    );

    if (data.token) {
      localStorage.setItem("admin_token", data.token);
      console.log("💾 Token saved to localStorage");
    }

    return { success: true, token: data.token };
  } catch (error) {
    console.error("💥 Error authenticating:", error);
    return { success: false };
  }
};
