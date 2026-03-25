# FIFA - Embedded Components Example

This project demonstrates a **container application** that embeds **FIFA Embedded Components** using the `smt-base-bridge` library. The container app handles authentication, passes auth tokens to embedded components, manages navigation, and provides a seamless integration experience.

## Overview

This example showcases:
- **User Authentication**: Login flow with email/password
- **Auth Token Passing**: Securely passing refresh tokens to embedded components
- **Isolated Embeddable Components**: Standalone components that can be embedded independently (Discover, Challenges, Card, Reward, AR Wearable)
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
- AR wearables available to try on

Supports navigation to card, reward, and AR wearable details via modals.

**Example**: `src/pages/Discover.tsx`

### 2. **Rewards Component**
Displays the user's rewards, including rewards they have acquired and can claim. Supports navigation to individual reward details, engaged cards, and AR wearables via modals.

**Example**: `src/pages/Rewards.tsx`

### 3. **Challenges Component**
Displays challenges that the user has started and their progress. Supports navigation to engaged cards via modal.

**Example**: `src/pages/Challenges.tsx`

### 4. **Card Component**
Displays detailed card information. Requires card ID as query parameter.

**⚠️ IMPORTANT**: Must include trailing `/` before query parameters

**Example**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/card/?id=123`

### 5. **Reward Component**
Shows reward details and redemption options. Requires reward ID as query parameter.

**⚠️ IMPORTANT**: Must include trailing `/` before query parameters

**Example**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/reward/?id=456`

### 6. **AR Wearable Component**
Displays AR wearable items (face filters, accessories, etc.) with interactive preview and try-on functionality. Requires wearable ID as query parameter.

**⚠️ IMPORTANT**: Must include trailing `/` before query parameters

**Example**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/wearable/?id=789`

**AR Permissions**: The AR Wearable component requires the `xr-spatial-tracking` permission to enable AR features. This is automatically configured in the `BridgedIframe` component via the iframe's `allow` attribute.

## Language Configuration

### Setting the Language

All embedded components support language configuration via the `lang` query parameter in the component URL. 

**⚠️ IMPORTANT**: When setting query parameters (including `lang`), the trailing `/` must be present before the `?` character.

**Correct Format**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/discover/?lang=es`

**Incorrect Format**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/discover?lang=es` ❌ (missing `/` before `?`)

### Language Detection Behavior

The embedded components use the following language detection priority:

1. **Explicit `lang` parameter**: If a `lang` query parameter is provided in the URL, that language will be used
2. **Browser language**: If no `lang` parameter is set, the component will attempt to use the browser's language setting
3. **Fallback**: If neither is available or supported, the component defaults to English (`en`)

### Supported Language Format

Language codes must use an **ISO 639-1 language code** with an optional **ISO 3166-1 alpha-2 regional code**, separated by a hyphen (for example, `en` or `en-US`).

**Examples**:
- `en` - English (generic)
- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `es` - Spanish (generic)
- `es-ES` - Spanish (Spain)
- `es-MX` - Spanish (Mexico)
- `fr` - French (generic)
- `fr-FR` - French (France)
- `de` - German

### Supported Languages

The specific languages supported depend on the FIFA configuration. Contact **SMT (Smart Media Technologies)** for:
- Complete list of supported languages
- Regional variant availability
- Language configuration updates

### Usage Examples

**Discover component with Spanish**:
```typescript
<BridgedIframe
  src="https://embedded.smartmedialabs.io/fifasandbox.beta/components/discover/?lang=es"
  className="w-full h-full"
/>
```

**Challenges component with French**:
```typescript
<BridgedIframe
  src="https://embedded.smartmedialabs.io/fifasandbox.beta/components/challenges/?lang=fr"
  className="w-full h-full"
/>
```

**Card component with language and ID parameters**:
```typescript
<BridgedIframe
  src="https://embedded.smartmedialabs.io/fifasandbox.beta/components/card/?id=123&lang=de"
  className="w-full h-full"
/>
```

**Dynamic language from state**:
```typescript
const [language, setLanguage] = useState('en');

<BridgedIframe
  src={`https://embedded.smartmedialabs.io/fifasandbox.beta/components/discover/?lang=${language}`}
  className="w-full h-full"
/>
```

### Important Notes

- Always include the trailing `/` before query parameters to ensure proper routing
- Language codes are case-insensitive but lowercase is recommended
- Invalid or unsupported language codes will fall back to the browser language or English
- The `lang` parameter can be combined with other query parameters (e.g., `?id=123&lang=es`)

### 7. **Tracking Consent Integration** (OneTrust)

The `BridgedIframe` component integrates with OneTrust to manage user tracking consent and communicate consent status to embedded components.

#### OneTrust Setup

OneTrust is loaded in the HTML file:

```html
<!-- public/index.html -->
<script src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"  type="text/javascript" charset="UTF-8" data-domain-script="<your-onetrust-key>" ></script>
```

#### Bridge Messages for Tracking Consent

**1. Request Handler: `tracking.consent.request`**

Child iframes can request the current consent status:

```typescript
// Child iframe requests consent status
const response = await bridge.sendRequest("tracking.consent.request", {});
// Returns: { canTrack: boolean, isReady: boolean }
```

**Response format:**
- `canTrack`: `true` if user has consented to tracking (OneTrust group C0002), `false` otherwise
- `isReady`: `true` if user has interacted with the OneTrust banner/preference center, `false` otherwise

**Implementation in BridgedIframe:**

```typescript
// Helper function to get cookie value
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
};

// Helper function to check OneTrust consent
const checkOneTrustConsent = useCallback((): {
  canTrack: boolean;
  isReady: boolean;
} => {
  // OneTrust script not loaded yet
  if (!window.OneTrust) {
    return { canTrack: false, isReady: false };
  }

  // True once user has interacted with banner / preference center
  const hasInteracted = !!getCookie("OptanonAlertBoxClosed");

  // Active consent groups
  const activeGroups = window.OnetrustActiveGroups || "";
  const activeGroupList = activeGroups
    .split(",")
    .map((group) => group.trim())
    .filter((group) => group.length > 0);
  const canTrack = activeGroupList.includes("C0002");

  return {
    canTrack,
    isReady: hasInteracted,
  };
}, []);

// Register request handler
bridge.addRequestHandler("tracking.consent.request", async () => {
  const consentStatus = checkOneTrustConsent();
  console.log("tracking.consent.request called, returning:", consentStatus);
  return consentStatus;
});
```

**Key Implementation Details:**

- **`isReady` Detection**: Uses the `OptanonAlertBoxClosed` cookie to determine if the user has interacted with the OneTrust banner or preference center. This is more reliable than checking if `window.OneTrust` exists, as the script may be loaded but the user hasn't made a choice yet.

- **`canTrack` Detection**: Parses the `OnetrustActiveGroups` string (comma-separated list) into an array and checks if group `C0002` is present. This is more robust than using `includes()` on the raw string, which could match partial group IDs.

**2. Push via `tracking.consent.update`**

The parent sends consent updates to child iframes using `sendRequest`:

```typescript
// Parent sends consent update to child
bridgeRef.current.sendRequest("tracking.consent.update", consentStatus);
```

This is sent:
- When OneTrust consent preferences change (via `OnConsentChanged` callback)
- 1 second after iframe initialization (to provide initial status)

**Implementation in BridgedIframe:**

```typescript
const sendConsentUpdate = useCallback(() => {
  if (!bridgeRef.current) return;

  const consentStatus = checkOneTrustConsent();
  console.log("Sending consent update to child:", consentStatus);

  try {
    bridgeRef.current.sendRequest("tracking.consent.update", consentStatus);
  } catch (error) {
    console.error("Error sending consent update:", error);
  }
}, [checkOneTrustConsent]);

// Listen for OneTrust consent changes
useEffect(() => {
  if (!window.OneTrust) {
    console.warn("OneTrust not available");
    return;
  }

  // Register callback for consent changes
  window.OneTrust.OnConsentChanged(() => {
    console.log("OneTrust consent changed");
    sendConsentUpdate();
  });

  console.log("OneTrust consent listener registered");
}, [sendConsentUpdate]);

// Send initial consent status after bridge initialization
useEffect(() => {
  // ... bridge setup code ...

  // Send initial consent status once bridge is ready
  // Use a small delay to ensure child is ready to receive
  const consentTimer = setTimeout(() => {
    sendConsentUpdate();
  }, 1000);

  return () => {
    clearTimeout(consentTimer);
    // ... cleanup code ...
  };
}, [src, navigate, iframe, onNavigation, sizeToContent, checkOneTrustConsent, sendConsentUpdate]);
```

#### Consent Status Object

Both messages return/send the same consent status object:

```typescript
{
  canTrack: boolean,  // true if C0002 group is active
  isReady: boolean    // true if user has interacted with OneTrust banner/preference center
}
```

#### OneTrust Consent Groups

The implementation checks for OneTrust group **C0002** (performance/analytics cookies). To use a different group ID, update `checkOneTrustConsent` in `BridgedIframe.tsx`:

```typescript
const canTrack = activeGroupList.includes("C0002"); // Update group ID as needed
```

#### Important Notes

- **Cookie-Based Detection**: The `isReady` flag relies on the `OptanonAlertBoxClosed` cookie, which OneTrust sets when the user interacts with the consent banner or preference center.

- **Robust Group Parsing**: The active groups are parsed into an array to avoid false positives from partial string matches (e.g., "C0002" vs "C00021").

- **Initial Status Delay**: A 1-second delay is used when sending the initial consent status to ensure the child iframe's bridge is ready to receive the message.

- **Automatic Updates**: The parent automatically sends consent updates whenever the user changes their preferences through OneTrust's UI.

### 8. **Full Embedded Viewer** (Legacy)
The full embedded viewer under `/main` provides the complete FIFA experience with all features (Discover, Map, Inventory, etc.). This is considered **legacy** and the isolated components above are the recommended approach for new integrations.

**⚠️ IMPORTANT**: The legacy embedded viewer **only supports `refreshToken` access**. When using the full embedded viewer, you must configure the `session.get` handler to return a refresh token, not an access token.

**Example**: `src/pages/Main.tsx`

## Prerequisites

The **`smt-base-bridge.min.js`** library from the `public/` directory must be loaded in your HTML to enable communication between the container app and the embedded components.

```html
<!-- public/index.html -->
<script src="./smt-base-bridge.min.js"></script>
```

This library provides the `SMTBaseBridge.ParentBridge` class used to establish communication with the child iframe.

### AR Wearable Permissions

For the AR Wearable component to function properly, the iframe must have the `xr-spatial-tracking` permission enabled. The `BridgedIframe` component automatically includes this permission along with other required permissions:

```typescript
<iframe
  allow="geolocation; camera; microphone; fullscreen; autoplay; clipboard-write; encrypted-media; gyroscope; accelerometer; web-share; xr-spatial-tracking"
/>
```

**Key Permissions for AR Wearables:**
- **`xr-spatial-tracking`**: Required for AR/XR experiences and spatial tracking
- **`camera`**: Required for camera access to display AR overlays
- **`gyroscope`** and **`accelerometer`**: Required for device orientation tracking in AR experiences

These permissions are automatically configured when using the `BridgedIframe` component from `src/components/BridgedIframe.tsx`.

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
- **Development URL**: `https://embedded.smtwallet.app/fifa/test/components/dev/` (allows using sandbox config on test origin, should only be used for development)
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

The `BridgedIframe` component (`src/components/BridgedIframe.tsx`) establishes communication with embedded components and handles authentication requests.

#### Supported Token Types

The `session.get` handler supports returning **either an access token or a refresh token**:

**Option 1: Return Access Token** (Recommended for isolated components)

```typescript
bridge.addRequestHandler("session.get", async () => {
  const accessToken = await authService.getAccessToken();
  console.log("session.get called, returning accessToken");
  return { accessToken };
});
```

When returning an access token, the container application manages the token refresh lifecycle. The embedded component receives a valid, ready-to-use access token.

**Option 2: Return Refresh Token** (Required for legacy embedded viewer)

```typescript
bridge.addRequestHandler("session.get", async () => {
  const refreshToken = authService.getRefreshToken();
  console.log("session.get called, returning refreshToken");
  return { refreshToken };
});
```

When returning a refresh token, the embedded component is responsible for managing the token refresh lifecycle and obtaining access tokens as needed.

**⚠️ IMPORTANT**: The **legacy full embedded viewer** (`/main`) **only supports `refreshToken` access**. If you are using the legacy viewer, you must use Option 2 and return a refresh token.

#### Complete Bridge Setup Examples

**Example 1: Using Access Token (Current Implementation)**

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

  // Register session.get handler - provides access token to embedded components
  bridge.addRequestHandler("session.get", async () => {
    const accessToken = await authService.getAccessToken();
    console.log("session.get called, returning accessToken");
    return { accessToken };
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

**Example 2: Using Refresh Token (Alternative)**

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

When an embedded component needs authentication, it calls `session.get` through the bridge, and the container responds with either an access token or refresh token depending on your implementation choice.

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
    } else if (feature === "ar-face-filter" && focus) {
      // Open AR wearable in modal
      setModalFocus({ id: focus, type: "wearable" });
      setShowModal(true);
    }
    return undefined;
  }}
/>
```

**Example: Rewards Page** (`src/pages/Rewards.tsx`):

```typescript
<BridgedIframe
  ref={iframeRef}
  src={`${host}/rewards/?lang=${appLanguage}`}
  className="w-full h-full rounded-lg shadow-lg border-0 grow"
  onNavigation={async (feature, focus) => {
    if (feature === "discover") {
      // Navigate back to discover
      setModalFocus(undefined);
      setShowModal(false);
    } else if (feature === "engaged" && focus) {
      // Open card in modal
      setModalFocus({ id: focus, type: "card" });
      setShowModal(true);
    } else if (feature === "reward" && focus) {
      // Open reward in modal
      setModalFocus({ id: focus, type: "reward" });
      setShowModal(true);
    } else if (feature === "ar-face-filter" && focus) {
      // Open AR wearable in modal
      setModalFocus({ id: focus, type: "wearable" });
      setShowModal(true);
    }
    return undefined;
  }}
  sizeToContent
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

### 6. Dynamic Iframe Resizing with frame.resize

The `BridgedIframe` component supports dynamic height adjustment based on the embedded content's size. This is particularly useful for components with variable height content that should scroll seamlessly as part of your page rather than having an internal scrollbar.

#### When to Use sizeToContent

Use the `sizeToContent` prop when:
- The embedded component has **variable height content** that changes dynamically
- You want the iframe to **scroll with your page** rather than having its own scrollbar
- The content should feel like a **native part of your page** rather than a separate scrollable area
- Examples: Discover page with dynamic content lists, search results, expandable sections

**Do NOT use** `sizeToContent` when:
- The component has a **fixed, known height**
- You want the iframe to have its **own internal scrollbar**
- The component is displayed in a **modal or fixed-size container**

#### How It Works

When `sizeToContent={true}` is set on the `BridgedIframe` component:

1. The embedded component measures its content height
2. It sends a `frame.resize` request through the bridge with the desired height
3. The parent container updates the iframe's height to match
4. The iframe grows/shrinks dynamically as content changes
5. The page scrollbar handles scrolling instead of the iframe

#### Implementation in BridgedIframe

The `frame.resize` handler is automatically registered when the bridge is initialized:

```typescript
// Register frame.resize handler
bridge.addRequestHandler("frame.resize", async ({ payload }) => {
  if (!sizeToContent) {
    return new BridgeError(
      "NOT_SUPPORTED",
      "frame.resize is not supported when sizeToContent is disabled",
    );
  }

  const { height } = payload as { height: number };
  
  if (typeof height !== "number" || height < 0) {
    return new BridgeError(
      "INVALID_PARAMETER",
      "height must be a positive number",
    );
  }

  if (iframe) {
    iframe.style.height = `${height}px`;
    console.log(`Iframe height resized to ${height}px`);
  }

  return {};
});
```

#### Usage Example: Discover Component

The Discover component displays variable height content (challenges, rewards, etc.) that should scroll seamlessly with the page:

```typescript
// src/pages/Discover.tsx
<BridgedIframe
  ref={iframeRef}
  src={`${host}/discover/?lang=${appLanguage}`}
  className="w-full h-full rounded-lg shadow-lg border-0 grow"
  onNavigation={onNavigation}
  sizeToContent={true}  // Enable dynamic resizing
/>
```

**Key points:**
- Set `sizeToContent={true}` to enable the resize handler
- The iframe will automatically adjust its height as the embedded content changes
- No fixed height needed - the iframe grows/shrinks with content
- Page-level scrolling provides a seamless user experience

#### Usage Example: Modal (Fixed Size)

For modals or fixed-size containers, do NOT use `sizeToContent`:

```typescript
// Modal with fixed dimensions - no sizeToContent
{modalFocus?.type === "card" && (
  <BridgedIframe
    src={`${host}/card/?id=${modalFocus.id}&lang=${appLanguage}`}
    className="w-full h-full rounded-lg shadow-2xl border-0"
    onNavigation={onNavigation}
    // sizeToContent NOT used - modal has fixed dimensions
  />
)}
```

#### Embedded Component Side (Child)

From within the embedded component, send resize requests when content height changes:

```typescript
// Inside the embedded component
const updateHeight = () => {
  const contentHeight = document.body.scrollHeight;
  
  // Send resize request to parent
  bridge.sendRequest("frame.resize", {
    height: contentHeight
  });
};

// Call when content changes
useEffect(() => {
  updateHeight();
}, [contentData]);
```

#### Error Handling

The `frame.resize` handler includes validation:

- **NOT_SUPPORTED**: Returned when `sizeToContent` is not enabled on the component
- **INVALID_PARAMETER**: Returned when height is not a positive number

```typescript
// If sizeToContent is false
bridge.sendRequest("frame.resize", { height: 500 })
// Returns: BridgeError("NOT_SUPPORTED", "frame.resize is not supported when sizeToContent is disabled")

// If height is invalid
bridge.sendRequest("frame.resize", { height: -100 })
// Returns: BridgeError("INVALID_PARAMETER", "height must be a positive number")
```

#### Best Practices

1. **Use for variable content**: Enable `sizeToContent` for components with dynamic, variable-height content
2. **Disable for fixed layouts**: Don't use `sizeToContent` for modals, fixed-height containers, or components with internal scrolling
3. **Performance**: The embedded component should debounce resize requests to avoid excessive updates
4. **Initial height**: Set a reasonable initial height via CSS to avoid layout shift before the first resize
5. **Minimum height**: Consider setting a `min-height` on the iframe to prevent it from collapsing completely

### 7. Logout

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
- **Rewards**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/rewards/`
- **Challenges**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/challenges/`
- **Card**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/card/?id={cardId}`
- **Reward**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/reward/?id={rewardId}`
- **AR Wearable**: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev/wearable/?id={wearableId}`

#### Sandbox Environment
- **Discover**: `https://embedded.smtwallet.app/fifa/sandbox/components/discover/`
- **Rewards**: `https://embedded.smtwallet.app/fifa/sandbox/components/rewards/`
- **Challenges**: `https://embedded.smtwallet.app/fifa/sandbox/components/challenges/`
- **Card**: `https://embedded.smtwallet.app/fifa/sandbox/components/card/?id={cardId}` ⚠️ **Requires trailing `/` before `?`**
- **Reward**: `https://embedded.smtwallet.app/fifa/sandbox/components/reward/?id={rewardId}` ⚠️ **Requires trailing `/` before `?`**
- **AR Wearable**: `https://embedded.smtwallet.app/fifa/sandbox/components/wearable/?id={wearableId}` ⚠️ **Requires trailing `/` before `?`**

#### Test Environment
- **Discover**: `https://embedded.smtwallet.app/fifa/test/components/discover/`
- **Rewards**: `https://embedded.smtwallet.app/fifa/test/components/rewards/`
- **Challenges**: `https://embedded.smtwallet.app/fifa/test/components/challenges/`
- **Card**: `https://embedded.smtwallet.app/fifa/test/components/card/?id={cardId}` ⚠️ **Requires trailing `/` before `?`**
- **Reward**: `https://embedded.smtwallet.app/fifa/test/components/reward/?id={rewardId}` ⚠️ **Requires trailing `/` before `?`**
- **AR Wearable**: `https://embedded.smtwallet.app/fifa/test/components/wearable/?id={wearableId}` ⚠️ **Requires trailing `/` before `?`**

#### Test Environment - Development URLs (for development only)
- **Discover**: `https://embedded.smtwallet.app/fifa/test/components/dev/discover/`
- **Rewards**: `https://embedded.smtwallet.app/fifa/test/components/dev/rewards/`
- **Challenges**: `https://embedded.smtwallet.app/fifa/test/components/dev/challenges/`
- **Card**: `https://embedded.smtwallet.app/fifa/test/components/dev/card/?id={cardId}` ⚠️ **Requires trailing `/` before `?`**
- **Reward**: `https://embedded.smtwallet.app/fifa/test/components/dev/reward/?id={rewardId}` ⚠️ **Requires trailing `/` before `?`**
- **Note**: These URLs allow using sandbox config on test origin and should only be used for development purposes

#### Live Environment
- **Discover**: `https://embedded.smtwallet.app/fifa/live/components/discover/`
- **Rewards**: `https://embedded.smtwallet.app/fifa/live/components/rewards/`
- **Challenges**: `https://embedded.smtwallet.app/fifa/live/components/challenges/`
- **Card**: `https://embedded.smtwallet.app/fifa/live/components/card/?id={cardId}` ⚠️ **Requires trailing `/` before `?`**
- **Reward**: `https://embedded.smtwallet.app/fifa/live/components/reward/?id={rewardId}` ⚠️ **Requires trailing `/` before `?`**
- **AR Wearable**: `https://embedded.smtwallet.app/fifa/live/components/wearable/?id={wearableId}` ⚠️ **Requires trailing `/` before `?`**

### Full Embedded Viewer (Legacy)

The full embedded viewer is available at `/main` but is considered **legacy**. For new integrations, use the isolated components above.

**⚠️ IMPORTANT**: The legacy embedded viewer **only supports `refreshToken` access**. When using the full embedded viewer, you must configure the `session.get` handler to return a refresh token (see "Passing Auth to Embedded Components" section).

**Example**: `https://embedded.smartmedialabs.io/fifasandbox.beta/#/discover`

## Token Refresh & Access Token Lifecycle

This application implements a robust token management system with automatic refresh token handling. The system uses two types of tokens:

- **Access Token**: Short-lived token used for API requests (stored in memory)
- **Refresh Token**: Long-lived token used to obtain new access tokens (stored in localStorage)

### ⚠️ Security Considerations for Production

**Important**: In this example, the refresh token is stored in `localStorage` for simplicity and demonstration purposes. However, **this is not recommended for production environments** due to XSS (Cross-Site Scripting) vulnerabilities.

For production applications, consider these more secure alternatives:

1. **Backend-Managed Refresh Tokens with HTTP-Only Cookies (Recommended)**:
   - When the cross-domain API returns the refresh token to your frontend, immediately pass it to your host application's backend
   - Store the refresh token server-side as an HTTP-only, Secure, SameSite cookie
   - Your backend handles token refresh requests and returns new access tokens
   - This prevents JavaScript access to the refresh token, protecting against XSS attacks
   - The refresh token still originates from the cross-domain API but is securely managed by your backend

2. **In-Memory Storage with Token Exchange**:
   - Keep refresh tokens in memory only (lost on page reload)
   - Implement a token exchange mechanism to obtain new refresh tokens when needed
   - Requires additional authentication flow for session restoration after page reload
   - Better than localStorage but requires users to re-authenticate more frequently

3. **Frontend Database Storage** (e.g., IndexedDB):
   - Store refresh tokens in a client-side database like IndexedDB instead of localStorage
   - Provides slightly better security than localStorage (not accessible via simple XSS)
   - Still vulnerable to sophisticated XSS attacks
   - **Not ideal** - better than localStorage but significantly less secure than backend storage

**For this example**: We use `localStorage` to demonstrate the token lifecycle in a simple, client-side-only implementation. When implementing in production with a cross-domain API, the recommended approach is to receive the refresh token from the API, then immediately pass it to your own backend for secure storage as an HTTP-only cookie.

### Token Lifecycle Overview

1. **Login**: User authenticates with email/password
2. **Token Storage**: Access token stored in memory, refresh token in localStorage
3. **API Requests**: Access token automatically validated and refreshed if needed
4. **Token Expiration Check**: JWT expiration checked before each request
5. **Automatic Refresh**: Expired access tokens automatically refreshed using refresh token
6. **Session Validation**: Refresh token validated to ensure minimum remaining session time

### Token Management in AuthService

The `authService` (`src/services/authService/index.ts`) manages the complete token lifecycle:

#### Login - Obtaining Tokens

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

  const data: ApiLoginResponse = await response.json();
  const token = data.payload.access_token.token;
  const refreshToken = data.payload.refresh_token.token;

  // Store access token in memory, refresh token in localStorage
  this.ACCESS_TOKEN = token;
  localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(this.USER_KEY, JSON.stringify(user));

  return { user, token, refreshToken };
}
```

#### Session Validation - Checking Token Expiration

The `isAuthenticated()` method validates the refresh token and ensures at least 5 minutes of remaining session time:

```typescript
isAuthenticated(): boolean {
  const refresh = this.getRefreshToken();
  // Make sure remaining user session is at least 5 min
  const isValid = checkJwtToken(refresh, 5 * 60 * 1000);
  return isValid;
}
```

The `checkJwtExpiration.ts` utility decodes and validates JWT tokens:

```typescript
export default function checkJwtToken(
  jwt: string | undefined | null,
  minRemainingTime = 30000
): boolean {
  if (!jwt) return false;
  try {
    const decodedToken: Record<string, any> = jwtDecode(jwt);
    const expirationTime: number = decodedToken.exp * 1000;
    const nowDate = Date.now();

    if (nowDate + minRemainingTime > expirationTime) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}
```

#### Refreshing Access Tokens

When an access token expires, the `refreshAccessToken()` method obtains a new one:

```typescript
async refreshAccessToken(): Promise<string> {
  const refreshToken = this.getRefreshToken();

  // Check if refresh token has expired before making network request
  if (!checkJwtToken(refreshToken)) {
    throw new Error("Refresh token has expired");
  }

  const response = await fetch(`${API_BASE_URL}/v1/access_token`, {
    method: "POST",
    headers: {
      "App-Id": APP_ID,
      Authorization: `Bearer ${refreshToken ?? ""}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("Unauthorized: Invalid refresh token or app ID mismatch");
  }

  const json: Record<string, any> = await response.json();
  const payload = json.payload as { access_token: { token: string } };
  const newAccessToken = payload.access_token.token;

  // Update stored access token in memory
  this.ACCESS_TOKEN = newAccessToken;

  return newAccessToken;
}
```

#### Getting a Valid Access Token

The `getAccessToken()` method ensures you always have a valid access token by checking expiration and refreshing if needed:

```typescript
async getAccessToken(): Promise<string> {
  let accessToken = this.getToken();

  // Check if access token is valid
  if (!accessToken || !checkJwtToken(accessToken)) {
    // Access token is invalid or expired, refresh it
    try {
      accessToken = await this.refreshAccessToken();
    } catch (error) {
      throw new Error("Failed to refresh access token. Please login again.");
    }
  }

  return accessToken;
}
```

This method can be used whenever you need a valid access token for API calls or other purposes.

#### Automatic Token Refresh with smtFetch

The `smtFetch()` method wraps all API calls with automatic token validation and refresh using `getAccessToken()`:

```typescript
async smtFetch(url: string, options?: RequestInit): Promise<Response> {
  const accessToken = await this.getAccessToken();

  // Merge headers with App-Id and Authorization
  const headers = {
    ...options?.headers,
    "App-Id": APP_ID,
    Authorization: `Bearer ${accessToken}`,
  };

  // Perform the fetch with the updated headers
  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
```

### Token Management in AuthContext

The `AuthContext` (`src/context/AuthContext.tsx`) provides application-wide authentication state and automatically validates sessions on mount:

```typescript
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in and fetch from API
    const fetchUser = async () => {
      try {
        // This uses smtFetch internally, which handles token refresh
        const currentUser = await authService.fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // If fetching the current user fails, clear the session and log out
        await authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Validate refresh token has at least 5 minutes remaining
    if (authService.isAuthenticated()) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const { user } = await authService.login(credentials);
    setUser(user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### Token Flow Summary

1. **User logs in** → Access token (memory) + Refresh token (localStorage) stored
2. **App initializes** → `AuthContext` checks if refresh token is valid (min 5 min remaining)
3. **API request made** → `smtFetch()` checks if access token is valid
4. **Access token expired** → Automatically refreshes using refresh token
5. **Refresh token expired** → User redirected to login
6. **User logs out** → Both tokens cleared from memory and localStorage

### Key Benefits

- **Automatic token refresh**: No manual intervention needed
- **Secure storage**: Access tokens in memory (not persisted), refresh tokens in localStorage
- **Proactive validation**: Tokens checked before requests to avoid failed API calls
- **Minimum session time**: Ensures at least 5 minutes of valid session on app load
- **Graceful degradation**: Falls back to login when refresh token expires

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **SweetAlert2** - Modal alerts and loaders
- **smt-base-bridge** - Iframe communication library
- **Webpack** - Module bundler
- **jwt-decode** - JWT token decoding for expiration validation

## License

Apache-2.0
