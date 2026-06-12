import { useCallback, useEffect, useState } from "react";
import {
  BridgedIframe,
  BridgedIframeHandle,
  InteractionBridgePayload,
} from "../components/BridgedIframe";
import { useApp } from "../context/AppContext";

export const Map = () => {
  const {
    legacyComponentsHost,
    mapComponentConfig,
    mapQueryParams,
    pendingMapCommand,
    clearPendingMapCommand,
    mapIframeHandle,
    setMapIframeHandle,
    setCurrentIframeUrl,
    appendUrlParams,
    bootMode,
  } = useApp();

  const [interactions, setInteractions] = useState<InteractionBridgePayload[]>([]);
  const handleRef = useCallback(
    (handle: BridgedIframeHandle | null) => {
      setMapIframeHandle(handle);
    },
    [setMapIframeHandle],
  );

  const src = appendUrlParams(`${legacyComponentsHost}/map/`, {
    lat: mapQueryParams.lat != null ? String(mapQueryParams.lat) : undefined,
    lon: mapQueryParams.lon != null ? String(mapQueryParams.lon) : undefined,
    zoom: mapQueryParams.zoom != null ? String(mapQueryParams.zoom) : undefined,
  });
  useEffect(() => {
    setCurrentIframeUrl(src);
    return () => setCurrentIframeUrl(null);
  }, [src, setCurrentIframeUrl]);

  useEffect(() => {
    return () => setMapIframeHandle(null);
  }, [setMapIframeHandle]);

  useEffect(() => {
    if (!pendingMapCommand || !mapIframeHandle) {
      return;
    }

    // Commands are queued briefly when the host navigates to /map before the iframe bridge is ready.
    let cancelled = false;

    const sendPendingMapCommand = async () => {
      try {
        if (pendingMapCommand.type === "viewport") {
          await mapIframeHandle.request("map.viewport.set", {
            center: pendingMapCommand.center,
            ...(pendingMapCommand.zoom != null ? { zoom: pendingMapCommand.zoom } : {}),
          });
        } else {
          await mapIframeHandle.request("map.userLocation.focus", {
            ...(pendingMapCommand.zoom != null ? { zoom: pendingMapCommand.zoom } : {}),
          });
        }
      } catch (error) {
        console.error("Sending pending map command failed:", error);
      } finally {
        if (!cancelled) {
          clearPendingMapCommand();
        }
      }
    };

    void sendPendingMapCommand();

    return () => {
      cancelled = true;
    };
  }, [pendingMapCommand, clearPendingMapCommand, mapIframeHandle]);

  const handleInteraction = useCallback((payload: InteractionBridgePayload) => {
    setInteractions((actions) => [payload, ...actions].slice(0, 5));
  }, []);

  return (
    <div className="relative flex flex-col min-h-0 grow">
      <BridgedIframe
        ref={handleRef}
        src={src}
        className="w-full h-full rounded-lg shadow-lg border-0 grow"
        componentConfig={mapComponentConfig}
        useRefreshToken={bootMode === "refresh-token"}
        onInteraction={handleInteraction}
      />
      {interactions.length > 0 ? (
        <section className="absolute right-4 top-4 z-10 w-[min(22rem,calc(100%-2rem))] rounded-md border border-slate-200 bg-white/95 p-3 text-sm text-slate-900 shadow-lg">
          <h2 className="mb-2 text-sm font-semibold">Latest interactions</h2>
          <ol className="space-y-2">
            {interactions.map((event, index) => (
              <li
                key={`${event.eventId}-${event.status}-${index}`}
                className="rounded border border-slate-100 bg-slate-50 px-2 py-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium capitalize">{event.action}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    {event.status}
                  </span>
                </div>
                <div className="truncate text-xs text-slate-600">{event.smtId}</div>
                <div className="truncate text-xs text-slate-500">{event.eventId}</div>
                {event.error?.requestId ? (
                  <div className="truncate text-xs text-red-700">
                    Request {event.error.requestId}
                  </div>
                ) : null}
                {event.location ? (
                  <div className="text-xs text-slate-600">
                    {event.location.lat.toFixed(5)}, {event.location.lon.toFixed(5)}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
};
