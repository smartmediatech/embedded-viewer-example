# FIFA - Container App Example

This project demonstrates a **container application** that embeds and communicates with the **FIFA Embedded Viewer** using the `smt-base-bridge` library. The container app handles authentication, passes auth tokens to the embedded viewer, manages navigation between features/pages, and handles logout functionality.

## Overview

This example showcases:
- **User Authentication**: Login flow with email/password
- **Auth Token Passing**: Securely passing refresh tokens to the embedded viewer
- **Feature Navigation**: Changing pages/features within the embedded viewer (e.g., Discover, Inventory, Map)
- **Isolated Embeddable Components**: Standalone components that can be embedded independently (Challenges, Discover, Card, Reward)
- **Logout Handling**: Coordinated logout between container and embedded viewer
- **Bridge Communication**: Two-way communication using the `smt-base-bridge` library
- **Modal Navigation**: Opening detailed views in modals with navigation handling

## Prerequisites

The **`smt-base-bridge.min.js`** library from the `public/` directory must be loaded in your HTML to enable communication between the container app and the embedded viewer.

```html
<!-- public/index.html -->
<script src="./smt-base-bridge.min.js"></script>
```

This library provides the `SMTBaseBridge.ParentBridge` class used to establish communication with the child iframe.

## Configuration

### Content Security Policy (CSP)

To embed the FIFA viewer and its components, your parent application must configure the Content Security Policy to allow frames from the required domain. Add the following `frame-src` directive to your CSP:

```
frame-src https://embedded.smartmedialabs.io
```

**Example CSP Header:**

```
Content-Security-Policy: frame-src 'self' https://embedded.smartmedialabs.io;
```

**Example Meta Tag (for development):**

```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-src 'self' https://embedded.smartmedialabs.io;">
```

### App ID and Embedded Viewer URL

Configure the App ID and Embedded Viewer URL in `src/services/authService.ts`:

```typescript
export const API_BASE_URL = "https://b.smartmedialabs.io";
export const APP_ID = "46fcb627-b237-4706-8175-299801d97cb5";
export const EMBEDDED_VIEWER_URL = "https://embedded.smartmedialabs.io/fifasandbox.beta/";
```

**⚠️ IMPORTANT**: The `APP_ID` configured here **must match** the App ID that the embedded viewer is configured to use. Mismatched App IDs will cause authentication and communication failures.

### Environment-Specific URLs

The embedded viewer is available in different environments:

#### Development Environment
- **For local development**: Use `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev`
- Use this URL when developing and testing locally
- **Important**: The container app must not have a referrer policy that blocks the child iframe from accessing the referrer. Ensure your referrer policy allows the embedded viewer to receive referrer information for proper authentication and functionality.

#### Staging Environment  
- **For production**: Use `https://embedded.smartmedialabs.io/fifasandbox.beta/components`
- **Target site**: `https://dev-www.fifa.com/`
- Use this URL for staging deployments

**Example configuration for local development:**

```typescript
// For local development
export const EMBEDDED_VIEWER_URL = "https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev";

// For staging
// export const EMBEDDED_VIEWER_URL = "https://embedded.smartmedialabs.io/fifasandbox.beta/components";
```

## Key Features

### 1. Login Flow

The login page (`src/pages/Login.tsx`) authenticates users via email and password:

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    await login({ email, password });
    navigate('/');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

The `authService.login()` method (`src/services/authService.ts`) makes an API call and stores the access token and refresh token:

```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const payload: ApiLoginPayload = {
    token: credentials.email,
    token_type: "email",
    auth_data: {
      password: credentials.password,
    },
  };

  const response = await fetch(`${API_BASE_URL}/v1/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "App-Id": APP_ID,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Invalid email or password");
  }

  const data: ApiLoginResponse = await response.json();
  const token = data.payload.access_token.token;
  const refreshToken = data.payload.refresh_token.token;

  // Store tokens in localStorage
  localStorage.setItem(this.STORAGE_KEY, token);
  localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(this.USER_KEY, JSON.stringify(user));

  return { user, token, refreshToken };
}
```

### 2. Passing Auth to the Embedded Viewer

The `BridgedIframe` component (`src/components/BridgedIframe.tsx`) establishes communication with the embedded viewer and handles authentication requests:

```typescript
useEffect(() => {
  const iframe = iframeRef.current;
  if (!iframe || !window.SMTBaseBridge) {
    console.error("Iframe or SMTBaseBridge not available");
    return;
  }

  const childOrigin = new URL(src);
  
  // Create bridge using ParentBridge constructor
  const bridge = new window.SMTBaseBridge.ParentBridge(iframe, {
    origin: childOrigin.origin,
    meta: {},
  });
  bridgeRef.current = bridge;

  // Register session.get handler - provides refresh token to embedded viewer
  bridge.addRequestHandler("session.get", async () => {
    const refreshToken = authService.getRefreshToken();
    console.log("session.get called, returning refreshToken");
    return { refreshToken };
  });

  // Register session.clear handler - handles logout from embedded viewer
  bridge.addRequestHandler("session.clear", async () => {
    console.log("session.clear called");
    await authService.logout();
    navigate("/login");
    return {};
  });

  // Set iframe src after bridge is configured
  setIframeSrc(src);

  return () => {
    // Cleanup handlers
    if (bridgeRef.current) {
      bridgeRef.current.removeRequestHandler("session.get");
      bridgeRef.current.removeRequestHandler("session.clear");
    }
  };
}, [src, navigate]);
```

When the embedded viewer needs authentication, it calls `session.get` through the bridge, and the container responds with the refresh token.

### 3. Changing Features/Pages

The container app can navigate the embedded viewer to different features using the bridge's `sendRequest` method:

**Main Page Navigation** (`src/pages/Main.tsx`):

```typescript
const handleGoToDiscover = async () => {
  try {
    await iframeRef.current?.goTo({ feature: "discover" });
  } catch (error) {
    console.error("Navigation to discover failed:", error);
  }
};

const handleGoToMap = async () => {
  try {
    await iframeRef.current?.goTo({ feature: "map" });
  } catch (error) {
    console.error("Navigation to map failed:", error);
  }
};

const handleGoToInventory = async () => {
  try {
    await iframeRef.current?.goTo({ feature: "inventory" });
  } catch (error) {
    console.error("Navigation to inventory failed:", error);
  }
};
```

**BridgedIframe Component** (`src/components/BridgedIframe.tsx`):

```typescript
// Expose goTo function via ref
useImperativeHandle(ref, () => ({
  goTo: async (params: {
    feature: string;
    focus?: string;
    extra?: string;
    params?: Record<string, any>;
  }) => {
    if (!bridgeRef.current) {
      throw new Error("Bridge not initialized");
    }
    return bridgeRef.current.sendRequest("navigation.go", params);
  },
}));
```

The embedded viewer can also request navigation changes, which the container can approve or reject:

```typescript
bridge.addRequestHandler("navigation.go", async ({ payload }) => {
  const { feature, focus, extra, params } = payload as {
    feature: string;
    focus: string;
    extra: string;
    params: Record<string, any>;
  };

  // Reject certain features
  if (
    feature === "ar" ||
    feature === "ar-face-filter" ||
    feature === "ar-wearable" ||
    feature === "ar-engaged" ||
    feature === "eight-wall"
  ) {
    alert("Request to goto " + feature + " rejected");
    return {};
  }
  
  // Approve supported routes
  return { feature, focus, extra, params };
});
```

### 4. Isolated Embeddable Components

The FIFA embedded viewer provides several **isolated components** that can be embedded independently without the full viewer experience. These components are perfect for integrating specific functionality into your container app:

#### Available Components

1. **Challenges Component** (`/components/challenges/`)
   - Displays challenges that the user has started and their progress
   - Supports navigation to engaged cards via modal
   - Example: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/challenges/`

2. **Discover Component** (`/components/discover/`)
   - Shows challenges available to start, rewards available to claim, as well as challenges the user has started and rewards they have acquired
   - Supports navigation to card and reward details
   - Example: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/discover/`

3. **Card Component** (`/components/card/?id={cardId}`)
   - Displays detailed card information
   - Requires card ID as query parameter
   - **⚠️ IMPORTANT**: Must include trailing `/` before query parameters
   - Example: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/card/?id=123`

4. **Reward Component** (`/components/reward/?id={rewardId}`)
   - Shows reward details and redemption options
   - Requires reward ID as query parameter
   - **⚠️ IMPORTANT**: Must include trailing `/` before query parameters
   - Example: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/reward/?id=456`

#### Using Isolated Components

**Example: Challenges Page** (`src/pages/Challenges.tsx`):

```typescript
<BridgedIframe
  ref={iframeRef}
  src="https://embedded.smartmedialabs.io/fifasandbox.beta/components/challenges/"
  className="w-full h-full rounded-lg shadow-lg border-0 flex-1"
  onNavigation={async (feature, focus) => {
    if (feature === "engaged" && focus) {
      // Open card in modal
      setModalFocus(focus);
      setShowModal(true);
    }
    return undefined;
  }}
/>
```

**Example: Discover Page with Modal Navigation** (`src/pages/Discover.tsx`):

```typescript
<BridgedIframe
  ref={iframeRef}
  src="https://embedded.smartmedialabs.io/fifasandbox.beta/components/discover/"
  className="w-full h-full rounded-lg shadow-lg border-0 flex-1"
  onNavigation={async (feature, focus) => {
    if (feature === "engaged" && focus) {
      setModalFocus({ id: focus, type: "card" });
      setShowModal(true);
    } else if (feature === "reward" && focus) {
      setModalFocus({ id: focus, type: "reward" });
      setShowModal(true);
    }
    return undefined;
  }}
/>

{/* Modal with Card or Reward component */}
{showModal && modalFocus?.type === "card" && (
  <BridgedIframe
    src={`https://embedded.smartmedialabs.io/fifasandbox.beta/components/card/?id=${modalFocus.id}`}
    className="w-full h-full rounded-lg shadow-2xl border-0"
  />
)}
```

### 5. Navigation Handling with onNavigation

The `BridgedIframe` component supports an optional `onNavigation` callback that allows you to intercept and handle navigation requests from the embedded component:

```typescript
interface BridgedIframeProps {
  src: string;
  className?: string;
  onNavigation?: (
    feature: string,
    focus?: string,
    extra?: string,
    params?: Record<string, string | boolean | number>,
  ) => Promise<
    | {
        feature: string;
        focus?: string;
        extra?: string;
        params: Record<string, string | boolean | number>;
      }
    | undefined
  >;
}
```

- **Return `undefined`**: Prevents the navigation (useful for opening modals instead)
- **Return navigation object**: Approves and potentially modifies the navigation
- **Throw error**: Rejects the navigation request

### 6. Loader and Alert Handlers

The `BridgedIframe` component handles loader and alert requests from embedded components:

**Loader Handlers** (using SweetAlert2):

```typescript
bridge.addRequestHandler("loader.show", async ({ payload }) => {
  const { label } = payload as { label: string };
  
  Swal.fire({
    title: label || "Loading...",
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
  
  return {};
});

bridge.addRequestHandler("loader.hide", async () => {
  Swal.close();
  return {};
});
```

**Alert Handlers** (not supported by default):

```typescript
bridge.addRequestHandler("alert.notify", async () => {
  return new BridgeError("NOT_SUPPORTED", "alert.notify is not supported");
});
```

### 7. Logout

Logout can be initiated from either the container or the embedded viewer:

**Container-Initiated Logout** (`src/pages/Main.tsx`):

```typescript
const handleLogout = async () => {
  setLoading(true);
  try {
    await logout();
    navigate("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    setLoading(false);
  }
};
```

**Embedded Viewer-Initiated Logout** (handled in `BridgedIframe.tsx`):

```typescript
// Register session.clear handler
bridge.addRequestHandler("session.clear", async () => {
  console.log("session.clear called");
  await authService.logout();
  navigate("/login");
  return {};
});
```

The `authService.logout()` method clears all stored tokens:

```typescript
async logout(): Promise<void> {
  localStorage.removeItem(this.STORAGE_KEY);
  localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  localStorage.removeItem(this.USER_KEY);
}
```

## Project Structure

```
fifa-embedded-example/
├── public/
│   ├── index.html                    # Loads smt-base-bridge.min.js
│   ├── smt-base-bridge.min.js        # Bridge library for iframe communication
│   └── smt-base-bridge.min.js.map
├── src/
│   ├── components/
│   │   ├── BridgedIframe.tsx         # Iframe component with bridge communication
│   │   └── ProtectedRoute.tsx        # Route protection wrapper
│   ├── context/
│   │   └── AuthContext.tsx           # Authentication context provider
│   ├── pages/
│   │   ├── Login.tsx                 # Login page
│   │   ├── Main.tsx                  # Main page with full embedded viewer
│   │   ├── Challenges.tsx            # Challenges component page with modal
│   │   └── Discover.tsx              # Discover component page with modals
│   ├── services/
│   │   └── authService.ts            # Authentication service (CONFIG HERE)
│   ├── types/                        # TypeScript type definitions
│   ├── App.tsx                       # Root application component with routing
│   └── index.tsx                     # Application entry point
├── package.json
└── webpack.config.js
```

## Installation & Running

### Install Dependencies

```bash
yarn install
```

### Development Server

```bash
yarn dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
yarn build
```

## Bridge Communication Flow

1. **Container loads** the embedded viewer or component in an iframe
2. **Bridge initialization**: `ParentBridge` is created with the iframe reference and origin
3. **Request handlers registered**: Container registers handlers for `session.get`, `session.clear`, `navigation.go`, `loader.show`, `loader.hide`, etc.
4. **Embedded viewer requests auth**: Calls `session.get` through the bridge
5. **Container responds**: Returns the refresh token
6. **Embedded viewer authenticates**: Uses the refresh token to obtain access tokens
7. **Navigation requests**: Either side can request navigation changes through the bridge
8. **Modal handling**: Container can intercept navigation to open modals with isolated components
9. **Logout coordination**: Either side can initiate logout, which is handled by both

## Embedded Component URLs

### Full Viewer
- **Base URL**: `https://embedded.smartmedialabs.io/fifasandbox.beta/`
- **Features**: `#/discover`, `#/map`, `#/inventory`, etc.

### Isolated Components

#### Development Environment (for local development)
- **Challenges**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/challenges/`
- **Discover**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/discover/`
- **Card**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/card/?id={cardId}`
- **Reward**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/reward/?id={rewardId}`

#### Production Environment
- **Challenges**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/challenges/`
- **Discover**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/discover/`
- **Card**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/card/?id={cardId}` ⚠️ **Requires trailing `/` before `?`**
- **Reward**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/reward/?id={rewardId}` ⚠️ **Requires trailing `/` before `?`**

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **SweetAlert2** - Modal alerts and loaders
- **smt-base-bridge** - Iframe communication library
- **Webpack** - Module bundler

## License

Apache-2.0
