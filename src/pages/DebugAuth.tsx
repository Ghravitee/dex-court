/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/DebugAuth.tsx
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/apiService";

export default function DebugAuth() {
  const { isAuthenticated, user, isLoading } = useAuth();

  const testEndpoint = async () => {
    try {
      const token = localStorage.getItem("authToken");
      console.log("🔐 [Debug] Current token:", token);

      if (!token) {
        console.log("🔐 [Debug] No token found");
        return;
      }

      // Test with fetch first
      console.log("🔐 [Debug] Testing with fetch...");
      const response = await fetch(
        "https://dev-api.dexcourt.com/accounts/mine",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("🔐 [Debug] Fetch response status:", response.status);
      const text = await response.text();
      console.log("🔐 [Debug] Fetch response body:", text);

      // Parse and analyze the response for username/handle
      try {
        const data = JSON.parse(text);
        console.log("🔐 [Debug] Parsed user data:", data);
        analyzeUserData(data);
      } catch (parseError) {
        console.error("🔐 [Debug] Failed to parse response:", parseError);
      }

      // Also test with axios
      console.log("🔐 [Debug] Testing with axios...");
      try {
        const axios = await import("../lib/apiClient");
        const axiosResponse = await axios.api.get("/accounts/mine");
        console.log("🔐 [Debug] Axios response:", axiosResponse.data);
        analyzeUserData(axiosResponse.data);
      } catch (axiosError) {
        console.error("🔐 [Debug] Axios test failed:", axiosError);
      }
    } catch (error) {
      console.error("🔐 [Debug] Test error:", error);
    }
  };

  // New function to analyze user data for username/handle
  const analyzeUserData = (userData: any) => {
    console.log("🔐 [Debug] === USER DATA ANALYSIS ===");

    // Log all top-level properties
    console.log("🔐 [Debug] Top-level properties:", Object.keys(userData));

    // Look for common username/handle fields
    const usernameFields = [
      "username",
      "handle",
      "userName",
      "userHandle",
      "displayName",
      "screenName",
      "login",
      "email",
      "firstName",
      "lastName",
      "fullName",
      "nickname",
    ];

    usernameFields.forEach((field) => {
      if (userData[field]) {
        console.log(
          `🔐 [Debug] Found potential identifier: ${field} = ${userData[field]}`,
        );
      }
    });

    // Deep search for username-like fields
    const deepSearchForUsername = (obj: any, path: string = ""): string[] => {
      const found: string[] = [];

      if (obj && typeof obj === "object") {
        for (const key in obj) {
          const currentPath = path ? `${path}.${key}` : key;
          const value = obj[key];

          // Check if this looks like a username field
          if (
            typeof value === "string" &&
            (key.toLowerCase().includes("user") ||
              key.toLowerCase().includes("handle") ||
              key.toLowerCase().includes("name")) &&
            value.length > 0 &&
            value.length < 50
          ) {
            found.push(`${currentPath}: "${value}"`);
          }

          // Recursively search nested objects
          if (typeof value === "object" && value !== null) {
            found.push(...deepSearchForUsername(value, currentPath));
          }
        }
      }

      return found;
    };

    const foundIdentifiers = deepSearchForUsername(userData);
    console.log("🔐 [Debug] All potential identifiers found:");
    foundIdentifiers.forEach((identifier) => {
      console.log(`🔐 [Debug]   - ${identifier}`);
    });

    // Store the most likely username for navigation
    const likelyUsername = findLikelyUsername(userData);
    if (likelyUsername) {
      console.log(`🔐 [Debug] Most likely username/handle: ${likelyUsername}`);
      // Store it for later use
      localStorage.setItem("debugUserHandle", likelyUsername);
    }
  };

  // Helper to find the most likely username
  const findLikelyUsername = (userData: any): string | null => {
    const priorityFields = ["handle", "username", "userName", "userHandle"];

    for (const field of priorityFields) {
      if (userData[field] && typeof userData[field] === "string") {
        return userData[field];
      }
    }

    // Fallback to email (without domain) or other identifiers
    if (userData.email) {
      return userData.email.split("@")[0];
    }

    return null;
  };

  // Test navigation with username/handle
  const testUserNavigation = async () => {
    const userHandle = localStorage.getItem("debugUserHandle");
    if (!userHandle) {
      console.log(
        "🔐 [Debug] No username/handle found. Run 'Test Endpoint' first.",
      );
      return;
    }

    console.log(`🔐 [Debug] Testing navigation for user: ${userHandle}`);

    // Test different user profile endpoint patterns
    const profileEndpoints = [
      `/users/${userHandle}`,
      `/profiles/${userHandle}`,
      `/accounts/${userHandle}`,
      `/u/${userHandle}`,
      `/@${userHandle}`,
      `/user/${userHandle}/profile`,
    ];

    for (const endpoint of profileEndpoints) {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `https://dev-api.dexcourt.com${endpoint}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        console.log(
          `🔐 [Debug] ${endpoint}: ${response.status} ${response.statusText}`,
        );

        if (response.ok) {
          console.log(`🔐 [Debug] SUCCESS! User profile found at: ${endpoint}`);
          const data = await response.json();
          console.log(`🔐 [Debug] Profile data:`, data);
          break;
        } else if (response.status === 404) {
          console.log(`🔐 [Debug] Profile not found at: ${endpoint}`);
        }
      } catch (error) {
        console.error(`🔐 [Debug] ${endpoint} error:`, error);
      }
    }
  };

  const inspectToken = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("🔐 [Debug] No token to inspect");
      return;
    }

    console.log("🔐 [Debug] Token inspection:");
    console.log("🔐 [Debug] Full token:", token);
    console.log("🔐 [Debug] Token length:", token.length);
    console.log("🔐 [Debug] Token type:", typeof token);

    // Check if it's a JWT
    const parts = token.split(".");
    console.log("🔐 [Debug] JWT parts:", parts.length);

    if (parts.length === 3) {
      try {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        console.log("🔐 [Debug] JWT Header:", header);
        console.log("🔐 [Debug] JWT Payload:", payload);

        // Check JWT payload for username info
        if (payload.sub || payload.username || payload.handle) {
          console.log("🔐 [Debug] JWT contains user identifiers:");
          if (payload.sub) console.log(`🔐 [Debug]   - sub: ${payload.sub}`);
          if (payload.username)
            console.log(`🔐 [Debug]   - username: ${payload.username}`);
          if (payload.handle)
            console.log(`🔐 [Debug]   - handle: ${payload.handle}`);
        }
      } catch (e) {
        console.error("🔐 [Debug] Failed to decode JWT:", e);
      }
    } else {
      console.log("🔐 [Debug] Token is not a standard JWT");
    }
  };

  const testAvatarEndpoints = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !user?.avatarId) {
      console.log("No token or avatar ID available");
      return;
    }

    const endpoints = [
      `/accounts/avatar/${user.avatarId}`,
      `/accounts/${user.id}/avatar`,
      `/accounts/${user.id}/avatar/${user.avatarId}`,
      `/avatar/${user.avatarId}`,
      `/files/${user.avatarId}`,
      `/accounts/${user.id}/file/${user.avatarId}`,
    ];

    console.log("🔐 Testing avatar endpoints...");

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(
          `https://dev-api.dexcourt.com${endpoint}`,
          {
            headers: {
              Authorization: token,
            },
          },
        );

        console.log(
          `🔐 ${endpoint}: ${response.status} ${response.statusText}`,
        );

        if (response.ok) {
          console.log(`🔐 SUCCESS! Avatar found at: ${endpoint}`);
          const blob = await response.blob();
          console.log(`🔐 Avatar blob: ${blob.size} bytes, ${blob.type}`);
          break;
        }
      } catch (error) {
        console.error(`🔐 ${endpoint} error:`, error);
      }
    }
  };

  // Add to DebugAuth.tsx
  const testUserLookup = async () => {
    const userHandle = localStorage.getItem("debugUserHandle");
    if (!userHandle) {
      console.log("🔐 [Debug] No username stored. Run 'Test Endpoint' first.");
      return;
    }

    console.log(`🔐 [Debug] Testing user lookup for: ${userHandle}`);

    try {
      // Test with your apiService
      const userData = await apiService.getUserByUsername(userHandle);
      console.log("🔐 [Debug] User lookup success:", userData);

      // Test navigation URL patterns
      const urlPatterns = [
        `/profile/${userHandle}`,
        `/user/${userHandle}`,
        `/u/${userHandle}`,
        `/users/${userHandle}`,
      ];

      console.log("🔐 [Debug] Testing navigation URLs:");
      urlPatterns.forEach((pattern) => {
        console.log(`🔐 [Debug]   ${window.location.origin}${pattern}`);
      });
    } catch (error) {
      console.error("🔐 [Debug] User lookup failed:", error);
    }
  };

  const testAllUsersEndpoint = async () => {
    try {
      console.log("🔐 [Debug] Testing /accounts endpoint...");
      const response = await fetch("https://dev-api.dexcourt.com/accounts", {
        headers: {
          Authorization: localStorage.getItem("authToken") || "",
        },
      });

      console.log("🔐 [Debug] All users response status:", response.status);

      if (response.ok) {
        const users = await response.json();
        console.log("🔐 [Debug] All users:", users);
        console.log("🔐 [Debug] Total users count:", users.length);

        // Find our test user
        const ghravUser = users.find((user: any) => user.username === "Ghrav");
        console.log("🔐 [Debug] Found Ghrav in all users:", ghravUser);
      } else {
        const errorText = await response.text();
        console.error("🔐 [Debug] Failed to get all users:", errorText);
      }
    } catch (error) {
      console.error("🔐 [Debug] Test all users error:", error);
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 rounded-lg border border-cyan-400/30 bg-black p-4">
      <h3 className="font-bold text-cyan-300">Auth Debug</h3>
      <p>Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
      <p>Loading: {isLoading ? "Yes" : "No"}</p>
      <p>User ID: {user?.id || "None"}</p>
      <p>Username: {localStorage.getItem("debugUserHandle") || "Not found"}</p>
      <div className="mt-2 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={testEndpoint}
            className="rounded bg-cyan-500 px-2 py-1 text-sm text-white"
          >
            Test Endpoint
          </button>
          <button
            onClick={inspectToken}
            className="rounded bg-purple-500 px-2 py-1 text-sm text-white"
          >
            Inspect Token
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={testAvatarEndpoints}
            className="rounded bg-green-500 px-2 py-1 text-sm text-white"
          >
            Test Avatar
          </button>
          <button
            onClick={testUserNavigation}
            className="rounded bg-orange-500 px-2 py-1 text-sm text-white"
          >
            Test Navigation
          </button>

          <button
            onClick={testUserLookup}
            className="rounded bg-blue-500 px-2 py-1 text-sm text-white"
          >
            Test User Lookup
          </button>
          <button
            onClick={testAllUsersEndpoint}
            className="rounded bg-red-500 px-2 py-1 text-sm text-white"
          >
            Test All Users
          </button>
        </div>
      </div>
    </div>
  );
}
