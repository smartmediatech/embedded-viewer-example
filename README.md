# FIFA - Embedded Components Example

This project demonstrates a **container application** that embeds **FIFA Embedded Components** using the `smt-base-bridge` library. The container app handles authentication, passes auth tokens to embedded components, manages navigation, and provides a seamless integration experience.

## Overview

This example showcases:
- **User Authentication**: Login flow with email/password
- **Auth Token Passing**: Securely passing refresh tokens to embedded components
- **Isolated Embeddable Components**: Standalone components that can be embedded independently (Discover, Challenges, Card, Reward)
- **Modal Navigation**: Opening detailed views in modals with navigation handling
- **Bridge Communication**: Two-way communication using the `smt-base-bridge` library
- **Logout Handling**: Coordinated logout between container and embedded components

## Key Embedded Components

### 1. **Discover Component** (Primary/Default)
The Discover component is the main landing page and shows:
- Challenges available to start
- Rewards available to claim
- Challenges the user has started
- Rewards they have acquired

Supports navigation to card and reward details via modals.

**Example**: `src/pages/Discover.tsx`

### 2. **Challenges Component**
Displays challenges that the user has started and their progress. Supports navigation to engaged cards via modal.

**Example**: `src/pages/Challenges.tsx`

### 3. **Card Component**
Displays detailed card information. Requires card ID as query parameter.

**⚠️ IMPORTANT**: Must include trailing `/` before query parameters

**Example**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/card/?id=123`

### 4. **Reward Component**
Shows reward details and redemption options. Requires reward ID as query parameter.

**⚠️ IMPORTANT**: Must include trailing `/` before query parameters

**Example**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/reward/?id=456`

### 5. **Full Embedded Viewer** (Legacy)
The full embedded viewer under `/main` provides the complete FIFA experience with all features (Discover, Map, Inventory, etc.). This is considered **legacy** and the isolated components above are the recommended approach for new integrations.

**Example**: `src/pages/Main.tsx`

## Prerequisites

The **`smt-base-bridge.min.js`** library from the `public/` directory must be loaded in your HTML to enable communication between the container app and the embedded components.

```html
<!-- public/index.html -->
<script src="./smt-base-bridge.min.js"></script>
```

This library provides the `SMTBaseBridge.ParentBridge` class used to establish communication with the child iframe.

## Configuration

### Content Security Policy (CSP)

To embed the FIFA components, your parent application must configure the Content Security Policy to allow frames from the required domains. Add the following `frame-src` directive to your CSP:

```
frame-src https://embedded.smartmedialabs.io https://embedded.smtwallet.app
```

**Example CSP Header:**

```
Content-Security-Policy: frame-src 'self' https://embedded.smartmedialabs.io https://embedded.smtwallet.app;
```

**Example Meta Tag (for development):**

```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-src 'self' https://embedded.smartmedialabs.io https://embedded.smtwallet.app;">
```

**Note:** 
- `https://embedded.smartmedialabs.io` is used for local development
- `https://embedded.smtwallet.app` is used for sandbox, test, and live environments

### Environment Configurations

The FIFA embedded components are available in multiple environments. Configure the appropriate App ID and URLs based on your target environment in `src/services/authService.ts`:

```typescript
const environmentConfigs = {
  sandbox: {
    origin: "https://dev-www.fifa.com",
    fqdn: "smt.fifasandbox",
    appId: "46fcb627-b237-4706-8175-299801d97cb5",
  },
  test: {
    origin: "https://ppr-www.fifa.com",
    fqdn: "smt.fifatest",
    appId: "4290980e-0b00-42fb-8b3e-c469af9823df",
  },
  live: {
    origin: "https://www.fifa.com",
    fqdn: "smt.fifa",
    appId: "be435e80-9b2e-4526-aa0c-070b2673aa64",
  },
};
```

**⚠️ IMPORTANT**: The `appId` configured here **must match** the App ID that the embedded components are configured to use. Mismatched App IDs will cause authentication and communication failures.

### Environment-Specific URLs

#### Local Development
- **For local development**: Use `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/`
- Use this URL when developing and testing locally
- **Important**: The container app must not have a referrer policy that blocks the child iframe from accessing the referrer. Ensure your referrer policy allows the embedded components to receive referrer information for proper authentication and functionality.

#### Sandbox Environment
- **Base URL**: `https://embedded.smtwallet.app/fifa/sandbox/components/`
- **Target site**: `https://dev-www.fifa.com`
- **App ID**: `46fcb627-b237-4706-8175-299801d97cb5`

#### Test Environment
- **Base URL**: `https://embedded.smtwallet.app/fifa/test/components/`
- **Target site**: `https://ppr-www.fifa.com`
- **App ID**: `4290980e-0b00-42fb-8b3e-c469af9823df`

#### Live Environment
- **Base URL**: `https://embedded.smtwallet.app/fifa/live/components/`
- **Target site**: `https://www.fifa.com`
- **App ID**: `be435e80-9b2e-4526-aa0c-070b2673aa64`

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

### 2. Passing Auth to Embedded Components

The `BridgedIframe` component (`src/components/BridgedIframe.tsx`) establishes communication with embedded components and handles authentication requests:

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

  // Register session.get handler - provides refresh token to embedded components
  bridge.addRequestHandler("session.get", async () => {
    const refreshToken = authService.getRefreshToken();
    console.log("session.get called, returning refreshToken");
    return { refreshToken };
  });

  // Register session.clear handler - handles logout from embedded components
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

When an embedded component needs authentication, it calls `session.get` through the bridge, and the container responds with the refresh token.

### 3. Using Isolated Components

**Example: Discover Page** (`src/pages/Discover.tsx`):

```typescript
<BridgedIframe
  ref={iframeRef}
  src={`${host}/discover/?lang=${appLanguage}`}
  className="w-full h-full rounded-lg shadow-lg border-0 flex-1"
  onNavigation={async (feature, focus) => {
    if (feature === "engaged" && focus) {
      // Open card in modal
      setModalFocus({ id: focus, type: "card" });
      setShowModal(true);
    } else if (feature === "reward" && focus) {
      // Open reward in modal
      setModalFocus({ id: focus, type: "reward" });
      setShowModal(true);
    }
    return undefined;
  }}
/>
```

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

### 4. Navigation Handling with onNavigation

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

### 5. Loader and Alert Handlers

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

### 6. Logout

Logout can be initiated from either the container or the embedded components:

**Container-Initiated Logout** (`src/pages/Discover.tsx`):

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

**Embedded Component-Initiated Logout** (handled in `BridgedIframe.tsx`):

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
│   │   ├── Discover.tsx              # Discover component page (DEFAULT)
│   │   ├── Challenges.tsx            # Challenges component page
│   │   └── Main.tsx                  # Full embedded viewer (LEGACY)
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

The app will be available at `http://localhost:3000` and will land on the **Discover** page by default.

### Production Build

```bash
yarn build
```

## Bridge Communication Flow

1. **Container loads** the embedded component in an iframe
2. **Bridge initialization**: `ParentBridge` is created with the iframe reference and origin
3. **Request handlers registered**: Container registers handlers for `session.get`, `session.clear`, `navigation.go`, `loader.show`, `loader.hide`, etc.
4. **Embedded component requests auth**: Calls `session.get` through the bridge
5. **Container responds**: Returns the refresh token
6. **Embedded component authenticates**: Uses the refresh token to obtain access tokens
7. **Navigation requests**: Either side can request navigation changes through the bridge
8. **Modal handling**: Container can intercept navigation to open modals with isolated components
9. **Logout coordination**: Either side can initiate logout, which is handled by both

## Embedded Component URLs

### Isolated Components (Recommended)

#### Local Development (for local development only)
- **Discover**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/discover/`
- **Challenges**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/challenges/`
- **Card**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/card/?id={cardId}`
- **Reward**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/reward/?id={rewardId}`

#### Sandbox Environment
- **Discover**: `https://embedded.smtwallet.app/fifa/sandbox/components/discover/`
- **Challenges**: `https://embedded.smtwallet.app/fifa/sandbox/components/challenges/`
- **Card**: `https://embedded.smtwallet.app/fifa/sandbox/components/card/?id={cardId}` ⚠️ **Requires trailing `/` before `?`**
- **Reward**: `https://embedded.smtwallet.app/fifa/sandbox/components/reward/?id={rewardId}` ⚠️ **Requires trailing `/` before `?`**

#### Test Environment
- **Discover**: `https://embedded.smtwallet.app/fifa/test/components/discover/`
- **Challenges**: `https://embedded.smtwallet.app/fifa/test/components/challenges/`
- **Card**: `https://embedded.smtwallet.app/fifa/test/components/card/?id={cardId}` ⚠️ **Requires trailing `/` before `?`**
- **Reward**: `https://embedded.smtwallet.app/fifa/test/components/reward/?id={rewardId}` ⚠️ **Requires trailing `/` before `?`**

#### Live Environment
- **Discover**: `https://embedded.smtwallet.app/fifa/live/components/discover/`
- **Challenges**: `https://embedded.smtwallet.app/fifa/live/components/challenges/`
- **Card**: `https://embedded.smtwallet.app/fifa/live/components/card/?id={cardId}` ⚠️ **Requires trailing `/` before `?`**
- **Reward**: `https://embedded.smtwallet.app/fifa/live/components/reward/?id={rewardId}` ⚠️ **Requires trailing `/` before `?`**

### Full Embedded Viewer (Legacy)

The full embedded viewer is available at `/main` but is considered **legacy**. For new integrations, use the isolated components above.

**Example**: `https://embedded.smartmedialabs.io/fifasandbox.beta/#/discover`

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
