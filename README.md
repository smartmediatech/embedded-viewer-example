# SMT Embedded Components - Example Container App

This project demonstrates a **container application** that embeds **SMT Embedded Components** using the `smt-base-bridge` library. The container app handles authentication, passes auth tokens to embedded components, manages navigation, and provides a seamless integration experience.

## Overview

This example showcases:

- **User Authentication**: Login flow with email/password
- **Auth Token Passing**: Securely passing tokens to embedded components
- **Isolated Embeddable Components**: Standalone components that can be embedded independently (Discover, Challenges, Card, Reward, AR Wearable, Map)
- **Modal Navigation**: Opening detailed views in modals with navigation handling
- **Bridge Communication**: Two-way communication using the `smt-base-bridge` library
- **Logout Handling**: Coordinated logout between container and embedded components

## Prerequisites

The **`smt-base-bridge.min.js`** library must be loaded in your HTML to enable communication between the container app and the embedded components.

```html
<script src="./smt-base-bridge.min.js"></script>
```

This library provides the `SMTBaseBridge.ParentBridge` class used to establish communication with the child iframe.

## Running the Example

```bash
yarn install
yarn dev
```

The app will be available at `https://localhost:3000`.

## Embedded Components

All component URLs follow the pattern `https://{componentsHost}/{componentName}/`. The `componentsHost` will be provided by SMT for your environment.

**Important**: All component URLs must include a trailing `/` before query parameters.

**Correct**: `https://{componentsHost}/discover/?lang=es`
**Incorrect**: `https://{componentsHost}/discover?lang=es` (missing `/` before `?`)

### Common Integration Requirements

All embedded components should be rendered in a `BridgedIframe` and share the same core bridge contract:

- Handle `session.get` so the component can authenticate
- Handle `session.clear` so embedded logout clears the host session
- Support `loader.show` and `loader.hide` for embedded loading states
- Optionally support `tracking.consent.request` and `tracking.consent.update` if your integration uses OneTrust

Additional bridge features depend on the component:

- Use `navigation.go` when you want the host app to intercept navigation and open modal/detail views
- Use `sizeToContent` for inline, variable-height embeds that should grow with the page
- Avoid `sizeToContent` for fixed-size modal embeds
- Use `component.config.get` and `component.config.update` for components like Map that accept host-provided configuration

### Discover Component

The primary landing experience within the embedded component suite, showing challenges, rewards, and AR wearables. Supports navigation to card, reward, and AR wearable details via modals.

**URL**: `https://{componentsHost}/discover/`

**Component-specific notes**:

- Optionally handle `navigation.go` if you want to open card, reward, or wearable details in host-controlled modals
- Consider `sizeToContent` when embedding inline in a scrolling page

### Rewards Component

Displays the user's rewards, including rewards they have acquired and can claim. Supports navigation to individual reward details, engaged cards, and AR wearables via modals.

**URL**: `https://{componentsHost}/rewards/`

**Component-specific notes**:

- Optionally handle `navigation.go` if you want to open reward, card, or wearable details in host-controlled modals
- Consider `sizeToContent` when embedding inline in a scrolling page

### Challenges Component

Displays challenges that the user has started and their progress. Supports navigation to engaged cards via modal.

**URL**: `https://{componentsHost}/challenges/`

**Component-specific notes**:

- Optionally handle `navigation.go` if you want to open engaged card details in a host-controlled modal
- Consider `sizeToContent` when embedding inline in a scrolling page

### Card Component

Displays detailed card information. Requires card ID as query parameter.

**URL**: `https://{componentsHost}/card/?id={cardId}`

**Component-specific notes**:

- Include the required `id` query parameter
- Do not use `sizeToContent` if rendering inside a fixed-size modal

### Reward Component

Shows reward details and redemption options. Requires reward ID as query parameter.

**URL**: `https://{componentsHost}/reward/?id={rewardId}`

**Component-specific notes**:

- Include the required `id` query parameter
- Do not use `sizeToContent` if rendering inside a fixed-size modal

### AR Wearable Component

Displays AR wearable items (face filters, accessories, etc.) with interactive preview and try-on functionality. Requires wearable ID as query parameter.

**URL**: `https://{componentsHost}/wearable/?id={wearableId}`

**Component-specific notes**:

- Include the required `id` query parameter
- Ensure the iframe `allow` attribute includes camera, gyroscope, accelerometer, and `xr-spatial-tracking`
- Do not use `sizeToContent` if rendering inside a fixed-size modal

### Map Component

Displays the standalone map component. Supports the same embedded auth/session contract as the other components and accepts a visual configuration object over the bridge.

**URL**: `https://{componentsHost}/map/`

**Component-specific notes**:

- Support `component.config.get` to provide initial map configuration
- Optionally send `component.config.update` for live theme/config changes

The example app demonstrates a simple light/dark theme toggle using:

- `component.config.get` for the initial config
- `component.config.update` for live theme changes

Current config shape:

```typescript
type MapComponentConfig = {
  theme?: {
    mode?: "light" | "dark";
    colors?: {
      accent?: string;
      locationButtonBackground?: string;
      locationButtonForeground?: string;
      pickupRadiusFill?: string;
    };
  };
};
```

## Configuration

### Content Security Policy (CSP)

To embed the components, your parent application must configure the Content Security Policy to allow frames from the required domains:

```
frame-src https://embedded.smtwallet.app
```

### Auth Configuration

Your application must be configured with an **App ID** provided by SMT. This App ID **must match** the App ID that the embedded components are configured to use. Mismatched App IDs will cause authentication and communication failures.

The API base URL for authentication is `https://b.smartmedialabs.io`.

### Iframe Permissions

The iframe must have the following permissions enabled via the `allow` attribute:

```typescript
<iframe
  allow="geolocation; camera; microphone; fullscreen; autoplay; clipboard-write; encrypted-media; gyroscope; accelerometer; web-share; xr-spatial-tracking"
/>
```

**Key Permissions for AR Wearables:**

- **`xr-spatial-tracking`**: Required for AR/XR experiences and spatial tracking
- **`camera`**: Required for camera access to display AR overlays
- **`gyroscope`** and **`accelerometer`**: Required for device orientation tracking

## Language Configuration

All embedded components support language configuration via the `lang` query parameter in the component URL.

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
- `es` - Spanish (generic)
- `fr` - French (generic)
- `de` - German

The specific languages supported depend on your configuration. Contact **SMT (Smart Media Technologies)** for the complete list of supported languages.

### Usage Examples

```typescript
// Discover component with Spanish
<BridgedIframe
  src={`${componentsHost}/discover/?lang=es`}
  className="w-full h-full"
/>

// Card with language and ID
<BridgedIframe
  src={`${componentsHost}/card/?id=123&lang=de`}
  className="w-full h-full"
/>
```

### Important Notes

- Always include the trailing `/` before query parameters to ensure proper routing
- Language codes are case-insensitive but lowercase is recommended
- Invalid or unsupported language codes will fall back to the browser language or English
- The `lang` parameter can be combined with other query parameters (e.g., `?id=123&lang=es`)

## Bridge Communication

### Bridge Setup

The `BridgedIframe` component (`src/components/BridgedIframe.tsx`) establishes communication with embedded components and handles authentication, navigation, and other requests.

```typescript
useEffect(() => {
  const iframe = iframeRef.current;
  if (!iframe || !window.SMTBaseBridge) {
    console.error("Iframe or SMTBaseBridge not available");
    return;
  }

  const childOrigin = new URL(src);

  const bridge = new window.SMTBaseBridge.ParentBridge(iframe, {
    origin: childOrigin.origin,
    meta: {},
  });
  bridgeRef.current = bridge;

  // Register session.get handler - provides access token to embedded components
  bridge.addRequestHandler("session.get", async () => {
    const accessToken = await authService.getAccessToken();
    return { accessToken };
  });

  // Register session.clear handler - handles logout from embedded components
  bridge.addRequestHandler("session.clear", async () => {
    await authService.logout();
    navigate("/login");
    return {};
  });

  // Set iframe src after bridge is configured
  setIframeSrc(src);

  return () => {
    if (bridgeRef.current) {
      bridgeRef.current.removeRequestHandler("session.get");
      bridgeRef.current.removeRequestHandler("session.clear");
    }
  };
}, [src, navigate]);
```

### Communication Flow

1. **Container loads** the embedded component in an iframe
2. **Bridge initialization**: `ParentBridge` is created with the iframe reference and origin
3. **Request handlers registered**: Container registers handlers for `session.get`, `session.clear`, `navigation.go`, `loader.show`, `loader.hide`, etc.
4. **Embedded component requests auth**: Calls `session.get` through the bridge
5. **Container responds**: Returns the access token (or refresh token for legacy viewer)
6. **Embedded component authenticates**: Uses the token for API requests
7. **Navigation requests**: Either side can request navigation changes through the bridge
8. **Modal handling**: Container can intercept navigation to open modals with isolated components
9. **Logout coordination**: Either side can initiate logout, which is handled by both

### Passing Auth to Embedded Components

#### Token Types

The `session.get` handler must return either an access token or a refresh token. **Access token mode is recommended for most integrations.**

**Access Token (recommended)**

The container manages the token lifecycle — refreshing expired access tokens and always providing a valid one to the embedded component.

```typescript
bridge.addRequestHandler("session.get", async () => {
  const accessToken = await authService.getAccessToken();
  return { accessToken };
});
```

**Refresh Token**

The embedded component manages its own token lifecycle. Required for the legacy full embedded viewer; not recommended for isolated components.

```typescript
bridge.addRequestHandler("session.get", async () => {
  const refreshToken = authService.getRefreshToken();
  return { refreshToken };
});
```

### Navigation Handling

The `BridgedIframe` component supports an optional `onNavigation` callback that allows you to intercept and handle navigation requests from the embedded component:

```typescript
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
```

- **Return `undefined`**: Prevents the navigation (useful for opening modals instead)
- **Return navigation object**: Approves and potentially modifies the navigation
- **Throw error**: Rejects the navigation request

**Example** (`src/pages/Discover.tsx`):

```typescript
<BridgedIframe
  src={`${componentsHost}/discover/?lang=en`}
  className="w-full h-full"
  onNavigation={async (feature, focus) => {
    if (feature === "engaged" && focus) {
      setModalFocus({ id: focus, type: "card" });
      setShowModal(true);
    } else if (feature === "reward" && focus) {
      setModalFocus({ id: focus, type: "reward" });
      setShowModal(true);
    } else if (feature === "ar-face-filter" && focus) {
      setModalFocus({ id: focus, type: "wearable" });
      setShowModal(true);
    }
    return undefined;
  }}
  sizeToContent
/>
```

### Loader and Alert Handlers

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

### Dynamic Iframe Resizing with frame.resize

The `BridgedIframe` component supports dynamic height adjustment based on the embedded content's size. This is useful for components with variable height content that should scroll seamlessly as part of your page rather than having an internal scrollbar.

#### When to Use sizeToContent

Use the `sizeToContent` prop when:

- The embedded component has **variable height content** that changes dynamically
- You want the iframe to **scroll with your page** rather than having its own scrollbar
- The content should feel like a **native part of your page** rather than a separate scrollable area

**Do NOT use** `sizeToContent` when:

- The component has a **fixed, known height**
- You want the iframe to have its **own internal scrollbar**
- The component is displayed in a **modal or fixed-size container**

#### How It Works

When `sizeToContent` is set on the `BridgedIframe` component:

1. The embedded component measures its content height
2. It sends a `frame.resize` request through the bridge with the desired height
3. The parent container updates the iframe's height to match
4. The iframe grows/shrinks dynamically as content changes
5. The page scrollbar handles scrolling instead of the iframe

#### Implementation

```typescript
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
  }

  return {};
});
```

#### Usage Examples

**Inline component** (scrolls with page):

```typescript
<BridgedIframe
  src={`${componentsHost}/discover/?lang=en`}
  className="w-full h-full"
  onNavigation={onNavigation}
  sizeToContent
/>
```

**Modal** (fixed size, do NOT use `sizeToContent`):

```typescript
<BridgedIframe
  src={`${componentsHost}/card/?id=${cardId}&lang=en`}
  className="w-full h-full"
  onNavigation={onNavigation}
/>
```

#### Best Practices

1. **Use for variable content**: Enable `sizeToContent` for components with dynamic, variable-height content
2. **Disable for fixed layouts**: Don't use `sizeToContent` for modals, fixed-height containers, or components with internal scrolling
3. **Performance**: The embedded component should debounce resize requests to avoid excessive updates
4. **Initial height**: Set a reasonable initial height via CSS to avoid layout shift before the first resize
5. **Minimum height**: Consider setting a `min-height` on the iframe to prevent it from collapsing completely

### Component Config Bridge

`BridgedIframe` supports an optional `componentConfig` prop. When provided:

- the iframe responds to `component.config.get` with the current config object
- the parent also pushes updates with `component.config.update` whenever the prop changes

Example:

```typescript
<BridgedIframe
  src={`${componentsHost}/map/?lang=en`}
  className="w-full h-full"
  componentConfig={{
    theme: {
      mode: "dark",
      colors: {
        accent: "#111827",
      },
    },
  }}
/>
```

### Logout

Logout can be initiated from either the container or the embedded components:

**Container-Initiated Logout**:

```typescript
const handleLogout = async () => {
  await logout();
  navigate("/login");
};
```

**Embedded Component-Initiated Logout** (handled in `BridgedIframe.tsx`):

```typescript
bridge.addRequestHandler("session.clear", async () => {
  await authService.logout();
  navigate("/login");
  return {};
});
```

### Tracking Consent Integration (OneTrust)

The `BridgedIframe` component integrates with OneTrust to manage user tracking consent and communicate consent status to embedded components.

#### OneTrust Setup

OneTrust is loaded in the HTML file:

```html
<script
  src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
  type="text/javascript"
  charset="UTF-8"
  data-domain-script="<your-onetrust-key>"
></script>
```

#### Bridge Messages for Tracking Consent

**1. Request Handler: `tracking.consent.request`**

Child iframes can request the current consent status:

```typescript
const response = await bridge.sendRequest("tracking.consent.request", {});
// Returns: { canTrack: boolean, isReady: boolean }
```

**Response format:**

- `canTrack`: `true` if user has consented to tracking (OneTrust group C0002), `false` otherwise
- `isReady`: `true` if user has interacted with the OneTrust banner/preference center, `false` otherwise

**Implementation in BridgedIframe:**

```typescript
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
};

const checkOneTrustConsent = useCallback((): {
  canTrack: boolean;
  isReady: boolean;
} => {
  if (!window.OneTrust) {
    return { canTrack: false, isReady: false };
  }

  const hasInteracted = !!getCookie("OptanonAlertBoxClosed");

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

bridge.addRequestHandler("tracking.consent.request", async () => {
  return checkOneTrustConsent();
});
```

**2. Push via `tracking.consent.update`**

The parent sends consent updates to child iframes using `sendRequest`:

```typescript
bridgeRef.current.sendRequest("tracking.consent.update", consentStatus);
```

This is sent:

- When OneTrust consent preferences change (via `OnConsentChanged` callback)
- 1 second after iframe initialization (to provide initial status)

#### Consent Status Object

Both messages return/send the same consent status object:

```typescript
{
  canTrack: boolean,  // true if C0002 group is active
  isReady: boolean    // true if user has interacted with OneTrust banner/preference center
}
```

#### OneTrust Consent Groups

The implementation checks for OneTrust group **C0002** (performance/analytics cookies). To use a different group ID, update `checkOneTrustConsent`:

```typescript
const canTrack = activeGroupList.includes("C0002"); // Update group ID as needed
```

#### Important Notes

- **Cookie-Based Detection**: The `isReady` flag relies on the `OptanonAlertBoxClosed` cookie, which OneTrust sets when the user interacts with the consent banner or preference center.
- **Robust Group Parsing**: The active groups are parsed into an array to avoid false positives from partial string matches (e.g., "C0002" vs "C00021").
- **Initial Status Delay**: A 1-second delay is used when sending the initial consent status to ensure the child iframe's bridge is ready to receive the message.
- **Automatic Updates**: The parent automatically sends consent updates whenever the user changes their preferences through OneTrust's UI.

## Token Refresh & Access Token Lifecycle

This application implements a robust token management system with automatic refresh token handling. The system uses two types of tokens:

- **Access Token**: Short-lived token used for API requests (stored in memory)
- **Refresh Token**: Long-lived token used to obtain new access tokens (stored in localStorage)

### Security Considerations for Production

**Important**: In this example, the refresh token is stored in `localStorage` for simplicity and demonstration purposes. However, **this is not recommended for production environments** due to XSS (Cross-Site Scripting) vulnerabilities.

For production applications, consider these more secure alternatives:

1. **Backend-Managed Refresh Tokens with HTTP-Only Cookies (Recommended)**:
   - When the cross-domain API returns the refresh token to your frontend, immediately pass it to your host application's backend
   - Store the refresh token server-side as an HTTP-only, Secure, SameSite cookie
   - Your backend handles token refresh requests and returns new access tokens

2. **In-Memory Storage with Token Exchange**:
   - Keep refresh tokens in memory only (lost on page reload)
   - Implement a token exchange mechanism to obtain new refresh tokens when needed

3. **Frontend Database Storage** (e.g., IndexedDB):
   - Store refresh tokens in a client-side database like IndexedDB instead of localStorage
   - **Not ideal** - better than localStorage but significantly less secure than backend storage

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

  this.ACCESS_TOKEN = token;
  localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);

  return { user, token, refreshToken };
}
```

#### Session Validation

The `isAuthenticated()` method validates the refresh token and ensures at least 5 minutes of remaining session time:

```typescript
isAuthenticated(): boolean {
  const refresh = this.getRefreshToken();
  const isValid = checkJwtToken(refresh, 5 * 60 * 1000);
  return isValid;
}
```

#### Refreshing Access Tokens

When an access token expires, the `refreshAccessToken()` method obtains a new one:

```typescript
async refreshAccessToken(): Promise<string> {
  const refreshToken = this.getRefreshToken();

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

  this.ACCESS_TOKEN = newAccessToken;
  return newAccessToken;
}
```

#### Getting a Valid Access Token

The `getAccessToken()` method ensures you always have a valid access token:

```typescript
async getAccessToken(): Promise<string> {
  let accessToken = this.getToken();

  if (!accessToken || !checkJwtToken(accessToken)) {
    try {
      accessToken = await this.refreshAccessToken();
    } catch (error) {
      throw new Error("Failed to refresh access token. Please login again.");
    }
  }

  return accessToken;
}
```

#### Automatic Token Refresh with smtFetch

The `smtFetch()` method wraps all API calls with automatic token validation and refresh:

```typescript
async smtFetch(url: string, options?: RequestInit): Promise<Response> {
  const accessToken = await this.getAccessToken();

  const headers = {
    ...options?.headers,
    "App-Id": APP_ID,
    Authorization: `Bearer ${accessToken}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
```

### Token Flow Summary

1. **User logs in** -> Access token (memory) + Refresh token (localStorage) stored
2. **App initializes** -> `AuthContext` checks if refresh token is valid (min 5 min remaining)
3. **API request made** -> `smtFetch()` checks if access token is valid
4. **Access token expired** -> Automatically refreshes using refresh token
5. **Refresh token expired** -> User redirected to login
6. **User logs out** -> Both tokens cleared from memory and localStorage

### Session Restoration in the Container App

The container app uses `AuthContext` (`src/context/AuthContext.tsx`) as the source of truth for authenticated UI state.

On app startup:

1. `AuthContext` checks whether the stored refresh token is still valid
2. If valid, it calls `authService.fetchCurrentUser()` to restore the signed-in user
3. If that request fails, the container clears the local session and treats the user as logged out
4. If no valid refresh token exists, the app remains unauthenticated and the user must log in again

```typescript
useEffect(() => {
  const fetchUser = async () => {
    try {
      const currentUser = await authService.fetchCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to fetch current user, logging out:", error);
      authService.clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (authService.isAuthenticated()) {
    fetchUser();
  } else {
    setLoading(false);
  }
}, []);
```

## Full Embedded Viewer (Legacy)

The full embedded viewer provides the complete experience with all features (Discover, Map, Inventory, etc.). This is considered **legacy** and the isolated components above are the recommended approach for new integrations.

**Example**: `src/pages/Main.tsx`

**Important**: The legacy embedded viewer **only supports `refreshToken` access**. When using the full embedded viewer, you must configure the `session.get` handler to return a refresh token, not an access token.

## License

Apache-2.0

---

## Appendix: FIFA Tenant Configuration

This section contains configuration details specific to the **FIFA** tenant.

### Environment Configurations

| Environment | Origin                     | FQDN              | App ID                                 |
| ----------- | -------------------------- | ----------------- | -------------------------------------- |
| Sandbox     | `https://dev-www.fifa.com` | `smt.fifasandbox` | `46fcb627-b237-4706-8175-299801d97cb5` |
| Test        | `https://ppr-www.fifa.com` | `smt.fifatest`    | `4290980e-0b00-42fb-8b3e-c469af9823df` |
| Live        | `https://www.fifa.com`     | `smt.fifa`        | `be435e80-9b2e-4526-aa0c-070b2673aa64` |

### Component URLs

#### SMT Local Development (internal use only)

Components host: `https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev`

**Important**: The container app must not have a referrer policy that blocks the child iframe from accessing the referrer. CSP must also include `frame-src https://embedded.smartmedialabs.io` for local development.

#### Sandbox Environment

Components host: `https://embedded.smtwallet.app/fifa/sandbox/components`

Available components: `/discover/`, `/rewards/`, `/challenges/`, `/card/?id={cardId}`, `/reward/?id={rewardId}`, `/wearable/?id={wearableId}`, `/map/`

#### Test Environment

Components host: `https://embedded.smtwallet.app/fifa/test/components`

##### Test - Development URLs (internal use only)

Components host: `https://embedded.smtwallet.app/fifa/test/components/dev`

These URLs allow using sandbox config on test origin and should only be used for development purposes.

#### Live Environment

Components host: `https://embedded.smtwallet.app/fifa/live/components`

### Legacy Full Embedded Viewer URL

**Example**: `https://embedded.smartmedialabs.io/fifasandbox.beta/#/discover`
