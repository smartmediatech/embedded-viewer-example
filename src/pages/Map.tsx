import { useCallback, useEffect } from "react";
import { BridgedIframe, BridgedIframeHandle } from "../components/BridgedIframe";
import { useApp } from "../context/AppContext";

export const Map = () => {
  const { legacyComponentsHost, mapComponentConfig, mapQueryParams, setMapIframeHandle, setCurrentIframeUrl, appendUrlParams, bootMode } = useApp();

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

  return (
    <>
      <BridgedIframe
        ref={handleRef}
        src={src}
        className="w-full h-full rounded-lg shadow-lg border-0 grow"
        componentConfig={mapComponentConfig}
        useRefreshToken={bootMode === "refresh-token"}
      />
    </>
  );
};
